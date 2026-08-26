const crypto = require("crypto");

const SESSION_COOKIE = "admin_session";
const SESSION_MS = 8 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const loginAttempts = new Map();

function getAdminUsername() {
  return String(process.env.ADMIN_USERNAME || "").trim();
}

function getAdminPasswordHash() {
  return String(process.env.ADMIN_PASSWORD_HASH || "").trim();
}

function getSessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.MONGODB_URI ||
    "change-this-admin-session-secret"
  );
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(String(password)).digest("hex");
}

function safeEqual(left, right) {
  const leftHash = crypto.createHash("sha256").update(String(left)).digest();
  const rightHash = crypto.createHash("sha256").update(String(right)).digest();
  return crypto.timingSafeEqual(leftHash, rightHash);
}

function getRequestIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.connection?.remoteAddress || "unknown";
}

function getRateLimit(ip) {
  const record = loginAttempts.get(ip);
  if (!record) return { blocked: false, remaining: MAX_ATTEMPTS };
  if (record.until && Date.now() < record.until) {
    return { blocked: true, retryAfter: record.until - Date.now(), remaining: 0 };
  }
  if (record.until && Date.now() >= record.until) {
    loginAttempts.delete(ip);
    return { blocked: false, remaining: MAX_ATTEMPTS };
  }
  return { blocked: false, remaining: Math.max(0, MAX_ATTEMPTS - record.count) };
}

function registerFailure(ip) {
  const current = loginAttempts.get(ip) || { count: 0 };
  current.count += 1;
  if (current.count >= MAX_ATTEMPTS) {
    current.until = Date.now() + LOCKOUT_MS;
  }
  loginAttempts.set(ip, current);
  return getRateLimit(ip);
}

function clearFailures(ip) {
  loginAttempts.delete(ip);
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  const cookies = {};
  header.split(";").forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    const eq = trimmed.indexOf("=");
    if (eq === -1) return;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

function createSessionToken(username) {
  const payload = Buffer.from(
    JSON.stringify({
      u: username,
      exp: Date.now() + SESSION_MS,
    })
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
  if (!safeEqual(signature, expected)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data?.u || !data?.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

function cookieOptions() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_MS / 1000)}${secure}`;
}

function setSessionCookie(res, token) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${token}; ${cookieOptions()}`);
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`
  );
}

function getSessionFromRequest(req) {
  const cookies = parseCookies(req);
  return verifySessionToken(cookies[SESSION_COOKIE]);
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(res, status, body) {
  if (typeof res.status === "function" && typeof res.json === "function") {
    return res.status(status).json(body);
  }
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function handleLogin(req, res) {
  if (req.method !== "POST") {
    res.setHeader?.("Allow", ["POST"]);
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const ip = getRequestIp(req);
  const limit = getRateLimit(ip);
  if (limit.blocked) {
    return sendJson(res, 429, {
      error: "Demasiados intentos. Inténtalo de nuevo más tarde.",
      retryAfter: limit.retryAfter,
    });
  }

  const username = getAdminUsername();
  const passwordHash = getAdminPasswordHash();
  if (!username || !passwordHash) {
    return sendJson(res, 500, { error: "Admin login is not configured" });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: "Invalid request" });
  }

  const submittedUser = String(body.username || "").trim();
  const submittedPassword = String(body.password || "");
  const submittedHash = hashPassword(submittedPassword);

  const userOk = safeEqual(submittedUser.toLowerCase(), username.toLowerCase());
  const passwordOk = safeEqual(submittedHash, passwordHash);

  if (!userOk || !passwordOk) {
    const updated = registerFailure(ip);
    return sendJson(res, 401, {
      error: "Usuario o contraseña incorrectos",
      remaining: updated.remaining,
    });
  }

  clearFailures(ip);
  const token = createSessionToken(username);
  setSessionCookie(res, token);
  return sendJson(res, 200, { success: true, username });
}

function handleSession(req, res) {
  if (req.method !== "GET") {
    res.setHeader?.("Allow", ["GET"]);
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const session = getSessionFromRequest(req);
  if (!session) {
    return sendJson(res, 401, { authenticated: false });
  }
  return sendJson(res, 200, { authenticated: true, username: session.u });
}

function handleLogout(req, res) {
  if (req.method !== "POST") {
    res.setHeader?.("Allow", ["POST"]);
    return sendJson(res, 405, { error: "Method not allowed" });
  }
  clearSessionCookie(res);
  return sendJson(res, 200, { success: true });
}

module.exports = {
  handleLogin,
  handleSession,
  handleLogout,
  getSessionFromRequest,
  readJsonBody,
  sendJson,
  SESSION_COOKIE,
};
