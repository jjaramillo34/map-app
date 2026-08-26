const { handleLogin } = require("../lib/adminAuth");

module.exports = async function handler(req, res) {
  return handleLogin(req, res);
};
