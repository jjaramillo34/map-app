const { handleLogout } = require("../lib/adminAuth");

module.exports = async function handler(req, res) {
  return handleLogout(req, res);
};
