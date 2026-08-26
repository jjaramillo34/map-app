const API_BASE = "/api/admin";

const parseJson = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return {};
  }
  return response.json();
};

export const loginAdmin = async (username, password) => {
  const response = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });
  const data = await parseJson(response);
  if (!response.ok) {
    const error = new Error(data.error || "No se pudo iniciar sesión");
    error.status = response.status;
    error.retryAfter = data.retryAfter;
    error.remaining = data.remaining;
    throw error;
  }
  return data;
};

export const getAdminSession = async () => {
  const response = await fetch(`${API_BASE}/session`, {
    credentials: "include",
  });
  if (!response.ok) return null;
  return parseJson(response);
};

export const logoutAdmin = async () => {
  await fetch(`${API_BASE}/logout`, {
    method: "POST",
    credentials: "include",
  });
};
