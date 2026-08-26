const { ObjectId } = require("mongodb");
const { getSessionFromRequest, readJsonBody, sendJson } = require("../lib/adminAuth");

function queryId(req) {
  if (req.query?.id) return String(req.query.id).trim();
  try {
    return new URL(req.url, "http://localhost").searchParams.get("id") || "";
  } catch {
    return "";
  }
}

function serializeList(item) {
  if (!item) return item;
  return {
    ...item,
    _id: item._id ? String(item._id) : undefined,
  };
}

async function handleVisitLists(req, res, getCollection) {
  if (!getSessionFromRequest(req)) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }

  let collection;
  try {
    collection = await getCollection();
  } catch (error) {
    console.error("[visit-lists]", error);
    return sendJson(res, 500, { error: "Database unavailable" });
  }

  if (req.method === "GET") {
    const lists = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return sendJson(res, 200, lists.map(serializeList));
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      return sendJson(res, 400, { error: "Invalid request" });
    }

    const name = String(body.name || "").trim().slice(0, 80);
    const groups = Array.isArray(body.groups) ? body.groups : [];
    if (!name) {
      return sendJson(res, 400, { error: "List name is required" });
    }
    if (!groups.length) {
      return sendJson(res, 400, { error: "Visit list is empty" });
    }

    const now = new Date().toISOString();
    const record = {
      name,
      source: String(body.source || "mapa").slice(0, 40),
      customers: Number(body.customers) || groups.reduce((sum, item) => sum + (item.count || 0), 0),
      groups: groups.map((item) => ({
        municipio: String(item.municipio || "").slice(0, 80),
        barrio: String(item.barrio || "").slice(0, 80),
        count: Number(item.count) || 0,
      })),
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(record);
    return sendJson(res, 200, {
      success: true,
      data: serializeList({ ...record, _id: result.insertedId }),
    });
  }

  if (req.method === "DELETE") {
    const id = queryId(req);
    if (!id) {
      return sendJson(res, 400, { error: "List id is required" });
    }
    if (!ObjectId.isValid(id)) {
      return sendJson(res, 400, { error: "Invalid list id" });
    }
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (!result.deletedCount) {
      return sendJson(res, 404, { error: "List not found" });
    }
    return sendJson(res, 200, { success: true });
  }

  res.setHeader?.("Allow", ["GET", "POST", "DELETE"]);
  return sendJson(res, 405, { error: "Method not allowed" });
}

module.exports = { handleVisitLists };
