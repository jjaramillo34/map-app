const { MongoClient } = require("mongodb");
const { handleVisitLists } = require("../lib/visitLists");

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

module.exports = async function handler(req, res) {
  return handleVisitLists(req, res, async () => {
    const client = await getClient();
    return client.db("powersolarpr").collection("visitLists");
  });
};
