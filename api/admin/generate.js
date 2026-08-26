const { handleGenerate } = require("../lib/gemini");

module.exports = async function handler(req, res) {
  return handleGenerate(req, res);
};
