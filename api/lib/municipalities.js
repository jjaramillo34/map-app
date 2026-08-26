const ALL_MUNICIPALITIES = require("../../src/data/municipioNames.json");
const { getSessionFromRequest, readJsonBody, sendJson } = require("./adminAuth");
const { serializeMunicipality } = require("./publicProfile");

const COLLECTION_NAME = "municipalities";

function namesMatch(left, right) {
  return (
    String(left || "").localeCompare(String(right || ""), "es", {
      sensitivity: "base",
    }) === 0
  );
}

function canonicalName(name) {
  const trimmed = String(name || "").trim();
  return ALL_MUNICIPALITIES.find((item) => namesMatch(item, trimmed)) || trimmed;
}

function queryName(req) {
  const raw = req.query?.name;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return "";
  try {
    return decodeURIComponent(String(value)).trim();
  } catch {
    return String(value).trim();
  }
}

function emptyProfile(name) {
  return { name };
}

function logMunicipalityError(error, req) {
  console.error("[municipalities]", {
    method: req?.method,
    url: req?.url,
    query: req?.query,
    statusCode: error.statusCode || 500,
    name: error.name,
    message: error.message,
    stack: error.stack,
    mongoCode: error.code,
  });
}

async function findMunicipality(collection, name) {
  if (!name) return null;
  const exact = await collection.findOne({ name });
  if (exact) return exact;

  const canonical = canonicalName(name);
  if (canonical && canonical !== name) {
    const byCanonical = await collection.findOne({ name: canonical });
    if (byCanonical) return byCanonical;
  }

  const municipalities = await collection.find({}).project({ name: 1 }).toArray();
  const match = municipalities.find((item) => namesMatch(item.name, name));
  if (!match) return null;
  return collection.findOne({ _id: match._id });
}

function indexByName(docs = []) {
  const index = [];
  docs.forEach((doc) => {
    if (doc?.name) index.push(doc);
  });
  return index;
}

function mergeCatalog(docs, { includePrivate }) {
  const result = {};
  const unused = indexByName(docs);

  ALL_MUNICIPALITIES.forEach((name) => {
    const matchIndex = unused.findIndex((item) => namesMatch(item.name, name));
    const doc = matchIndex >= 0 ? unused.splice(matchIndex, 1)[0] : emptyProfile(name);
    result[name] = serializeMunicipality(
      { ...doc, name },
      { includePrivate }
    );
  });

  unused.forEach((doc) => {
    result[doc.name] = serializeMunicipality(doc, { includePrivate });
  });

  return result;
}

async function handleMunicipalities(req, res, getCollection) {
  try {
    let collection;
    try {
      collection = await getCollection();
    } catch (error) {
      logMunicipalityError(error, req);
      return sendJson(res, error.statusCode || 500, {
        error: "Database unavailable",
        message: error.message,
      });
    }

    const includePrivate = Boolean(getSessionFromRequest(req));
    const name = queryName(req);

    if (req.method === "GET") {
      if (name) {
        const municipality = await findMunicipality(collection, name);
        if (municipality) {
          return sendJson(
            res,
            200,
            serializeMunicipality(municipality, { includePrivate })
          );
        }
        const canonical = canonicalName(name);
        if (ALL_MUNICIPALITIES.some((item) => namesMatch(item, canonical))) {
          return sendJson(res, 200, emptyProfile(canonical));
        }
        return sendJson(res, 404, { error: "Municipality not found" });
      }

      const municipalities = await collection.find({}).toArray();
      return sendJson(res, 200, mergeCatalog(municipalities, { includePrivate }));
    }

    if (req.method === "POST") {
      if (!getSessionFromRequest(req)) {
        return sendJson(res, 401, { error: "Unauthorized" });
      }

      let body;
      try {
        body = await readJsonBody(req);
      } catch (error) {
        logMunicipalityError(error, req);
        return sendJson(res, 400, { error: "Invalid request" });
      }

      const municipalityName = canonicalName(body.name);
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
        data: serializeMunicipality(municipalityData, { includePrivate: true }),
      });
    }

    if (req.method === "DELETE") {
      if (!getSessionFromRequest(req)) {
        return sendJson(res, 401, { error: "Unauthorized" });
      }
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

    res.setHeader?.("Allow", ["GET", "POST", "DELETE"]);
    return sendJson(res, 405, { error: `Method ${req.method} not allowed` });
  } catch (error) {
    logMunicipalityError(error, req);
    return sendJson(res, 500, {
      error: "Internal server error",
      message: error.message,
    });
  }
}

module.exports = {
  COLLECTION_NAME,
  ALL_MUNICIPALITIES,
  canonicalName,
  handleMunicipalities,
  namesMatch,
};
