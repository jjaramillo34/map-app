const { MongoClient } = require("mongodb");
const { handleLogin, handleSession, handleLogout, getSessionFromRequest } = require("../api/lib/adminAuth");
const { handleGenerate } = require("../api/lib/gemini");
const { serializeMunicipality } = require("../api/lib/publicProfile");
const { handleVisitLists } = require("../api/lib/visitLists");

const DB_NAME = "powersolarpr";
const COLLECTION_NAME = "municipalities";

let clientPromise;

function getClient() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined");
  }
  if (!clientPromise) {
    clientPromise = new MongoClient(process.env.MONGODB_URI).connect();
  }
  return clientPromise;
}

function namesMatch(left, right) {
  return left.localeCompare(right, "es", { sensitivity: "base" }) === 0;
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function findMunicipality(collection, name) {
  const exact = await collection.findOne({ name });
  if (exact) return exact;

  const municipalities = await collection.find({}).toArray();
  return municipalities.find((item) => item.name && namesMatch(item.name, name));
}

module.exports = function (app) {
  app.use("/api/admin/login", async (req, res) => handleLogin(req, res));
  app.use("/api/admin/session", async (req, res) => handleSession(req, res));
  app.use("/api/admin/logout", async (req, res) => handleLogout(req, res));
  app.use("/api/admin/generate", async (req, res) => handleGenerate(req, res));
  app.use("/api/admin/visit-lists", async (req, res) => {
    try {
      const client = await getClient();
      return handleVisitLists(req, res, async () =>
        client.db(DB_NAME).collection("visitLists")
      );
    } catch (error) {
      console.error("[setupProxy] visit-lists:", error);
      return sendJson(res, 500, { error: "Internal server error" });
    }
  });

  app.use("/api/municipalities", async (req, res) => {
    try {
      const client = await getClient();
      const collection = client.db(DB_NAME).collection(COLLECTION_NAME);
      const name = decodeURIComponent(req.query.name || "").trim();

      if (req.method === "POST" || req.method === "DELETE") {
        if (!getSessionFromRequest(req)) {
          return sendJson(res, 401, { error: "Unauthorized" });
        }
      }

      if (req.method === "GET") {
        const includePrivate = Boolean(getSessionFromRequest(req));
        if (name) {
          const municipality = await findMunicipality(collection, name);
          if (!municipality) {
            return sendJson(res, 404, { error: "Municipality not found" });
          }
          return sendJson(res, 200, serializeMunicipality(municipality, { includePrivate }));
        }

        const municipalities = await collection.find({}).toArray();
        const result = {};
        municipalities.forEach((item) => {
          result[item.name] = serializeMunicipality(item, { includePrivate });
        });
        return sendJson(res, 200, result);
      }

      if (req.method === "POST") {
        const body = await readJsonBody(req);
        const municipalityName = (body.name || "").trim();
        if (!municipalityName) {
          return sendJson(res, 400, { error: "Municipality name is required" });
        }

        const { name: _ignored, ...data } = body;
        const municipalityData = {
          name: municipalityName,
          ...data,
          updatedAt: new Date().toISOString(),
        };

        const result = await collection.updateOne(
          { name: municipalityName },
          { $set: municipalityData },
          { upsert: true }
        );

        return sendJson(res, 200, {
          success: true,
          message: result.upsertedCount > 0 ? "Municipality created" : "Municipality updated",
          data: municipalityData,
        });
      }

      if (req.method === "DELETE") {
        if (!name) {
          return sendJson(res, 400, { error: "Municipality name is required" });
        }

        const existing = await findMunicipality(collection, name);
        if (!existing) {
          return sendJson(res, 404, { error: "Municipality not found" });
        }

        await collection.deleteOne({ _id: existing._id });
        return sendJson(res, 200, { success: true, message: "Municipality deleted" });
      }

      res.setHeader("Allow", ["GET", "POST", "DELETE"]);
      return sendJson(res, 405, { error: `Method ${req.method} not allowed` });
    } catch (error) {
      console.error("[setupProxy] municipalities API:", error);
      return sendJson(res, 500, {
        error: "Internal server error",
        message: error.message,
      });
    }
  });
};
