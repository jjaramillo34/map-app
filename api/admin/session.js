const { handleSession } = require("../lib/adminAuth");

module.exports = async function handler(req, res) {
  return handleSession(req, res);
};
