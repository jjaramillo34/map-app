const { MongoClient } = require("mongodb");

const DB_NAME = "powersolarpr";

// Serverless: one small pool per warm isolate. Atlas shared clusters cannot
// absorb maxPoolSize 10 multiplied by concurrent lambdas.
const OPTIONS = {
  maxPoolSize: 5,
  minPoolSize: 0,
  maxIdleTimeMS: 15000,
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 10000,
};

function getMongoClient() {
  const uri = String(process.env.MONGODB_URI || "").trim();
  if (!uri) {
    const error = new Error("MONGODB_URI is not defined");
    error.statusCode = 500;
    throw error;
  }

  if (!globalThis._mapAppMongoPromise) {
    globalThis._mapAppMongoPromise = new MongoClient(uri, OPTIONS).connect();
  }
  return globalThis._mapAppMongoPromise;
}

async function getCollection(collectionName) {
  const client = await getMongoClient();
  return client.db(DB_NAME).collection(collectionName);
}

module.exports = {
  DB_NAME,
  getMongoClient,
  getCollection,
};
