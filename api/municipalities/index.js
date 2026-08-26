const { getCollection } = require("../lib/mongoClient");
const { COLLECTION_NAME, handleMunicipalities } = require("../lib/municipalities");

module.exports = async function handler(req, res) {
  return handleMunicipalities(req, res, () => getCollection(COLLECTION_NAME));
};
