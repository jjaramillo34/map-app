const { handleLogin, handleSession, handleLogout } = require("../api/lib/adminAuth");
const { handleGenerate } = require("../api/lib/gemini");
const { handleVisitLists } = require("../api/lib/visitLists");
const { getCollection } = require("../api/lib/mongoClient");
const { COLLECTION_NAME, handleMunicipalities } = require("../api/lib/municipalities");

module.exports = function (app) {
  app.use("/api/admin/login", async (req, res) => handleLogin(req, res));
  app.use("/api/admin/session", async (req, res) => handleSession(req, res));
  app.use("/api/admin/logout", async (req, res) => handleLogout(req, res));
  app.use("/api/admin/generate", async (req, res) => handleGenerate(req, res));
  app.use("/api/admin/visit-lists", async (req, res) =>
    handleVisitLists(req, res, () => getCollection("visitLists"))
  );
  app.use("/api/municipalities", async (req, res) =>
    handleMunicipalities(req, res, () => getCollection(COLLECTION_NAME))
  );
};
