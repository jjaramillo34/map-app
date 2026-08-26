const { getCollection } = require("../lib/mongoClient");
const { handleVisitLists } = require("../lib/visitLists");

module.exports = async function handler(req, res) {
  return handleVisitLists(req, res, () => getCollection("visitLists"));
};
