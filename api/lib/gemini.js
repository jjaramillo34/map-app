const { getSessionFromRequest, readJsonBody, sendJson } = require("./adminAuth");
const {
  defaultModel: DEFAULT_MODEL,
  models: GEMINI_MODEL_OPTIONS,
} = require("../../src/data/geminiModels.json");

const ALLOWED_MODELS = new Set(GEMINI_MODEL_OPTIONS.map((item) => item.id));

function getApiKey() {
  return String(process.env.GEMINI_API_KEY || "").trim();
}

function extractText(payload) {
  return (payload?.candidates || [])
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => part?.text || "")
    .join("")
    .trim();
}

function parseJsonContent(text) {
  const jsonMatch = String(text || "").match(/\{[\s\S]*\}/);
  try {
    return JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch {
    throw new Error("Gemini devolvió un JSON inválido");
  }
}

function resolveModel(requested) {
  const model = String(requested || "").trim();
  return ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL;
}

async function callGemini(prompt, { json = false, model } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const selectedModel = resolveModel(model);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          ...(json ? { responseMimeType: "application/json" } : {}),
        },
      }),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data.error?.message || `Gemini API error: ${response.status}`
    );
  }

  const text = extractText(data);
  if (!text) {
    throw new Error("Gemini no devolvió contenido");
  }

  return json ? parseJsonContent(text) : text;
}

function statsBlock(stats = {}) {
  return `
Datos reales del mapa de clientes solares:
- Clientes de energía solar: ${stats.customers ?? "N/A"}
- Ingreso promedio: $${stats.avgIncome?.toLocaleString?.() || stats.avgIncome || "N/A"}
- Tasa de penetración solar: ${stats.penetrationRate ?? "N/A"}%
- Población promedio: ${stats.avgPopulation?.toLocaleString?.() || stats.avgPopulation || "N/A"}
`;
}

function normalizeGeneratedPoi(item) {
  if (!item) return null;
  if (typeof item === "string") {
    const trimmed = item.trim();
    if (!trimmed) return null;
    const [name, ...rest] = trimmed.split(/\s+[—–-]\s+/);
    return { name: name.trim(), why: rest.join(" — ").trim(), lat: null, lng: null };
  }
  if (typeof item === "object") {
    const name = String(item.name || item.title || "").trim();
    if (!name) return null;
    return {
      name,
      why: String(item.why || item.reason || "").trim(),
      lat: null,
      lng: null,
    };
  }
  return null;
}

async function generateMunicipalityProfile(municipioName, stats = {}, model) {
  const prompt = `Eres un experto en municipios de Puerto Rico, energía solar y desarrollo de mercado.

Genera un JSON para el municipio de ${municipioName}, Puerto Rico.

${statsBlock(stats)}

Requisitos:
- Español profesional y atractivo
- Usa Censo de EE.UU. (especifica el año, preferiblemente 2020) y Wikipedia
- Incluye datos demográficos, ingresos, educación, vivienda y empleo
- Destaca el potencial solar y el contexto comercial local
- solarOpportunity: 2-3 frases sobre por qué este municipio es una oportunidad de mercado solar
- pointsOfInterest: 3-5 lugares concretos. Cada uno es un objeto con name (lugar) y why (por qué importa a un vendedor solar)

Responde SOLO con JSON válido:
{
  "description": "descripción de 3-5 párrafos separados por \\n\\n",
  "tags": ["tag1", "tag2", "tag3"],
  "highlights": ["dato 1", "dato 2", "dato 3"],
  "funFact": "dato curioso",
  "pointsOfInterest": [
    { "name": "Plaza de Recreo", "why": "centro comercial del casco" }
  ],
  "solarOpportunity": "oportunidad de mercado solar",
  "sources": ["US Census Bureau 2020", "Wikipedia - ${municipioName}"],
  "censusYear": "2020"
}`;

  const selectedModel = resolveModel(model);
  const profile = await callGemini(prompt, { json: true, model: selectedModel });
  return {
    model: selectedModel,
    description: profile.description || "",
    tags: Array.isArray(profile.tags) ? profile.tags : [],
    highlights: Array.isArray(profile.highlights) ? profile.highlights : [],
    funFact: profile.funFact || "",
    pointsOfInterest: (Array.isArray(profile.pointsOfInterest) ? profile.pointsOfInterest : [])
      .map(normalizeGeneratedPoi)
      .filter(Boolean),
    solarOpportunity: profile.solarOpportunity || "",
    sources: Array.isArray(profile.sources) ? profile.sources : [],
    censusYear: profile.censusYear || "",
  };
}

async function handleGenerate(req, res) {
  if (req.method !== "POST") {
    res.setHeader?.("Allow", ["POST"]);
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  if (!getSessionFromRequest(req)) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }

  if (!getApiKey()) {
    return sendJson(res, 500, { error: "Gemini API key is not configured" });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: "Invalid request" });
  }

  const municipioName = String(body.name || "").trim().slice(0, 80);
  if (!municipioName) {
    return sendJson(res, 400, { error: "Municipality name is required" });
  }

  try {
    const profile = await generateMunicipalityProfile(
      municipioName,
      body.stats || {},
      body.model
    );
    return sendJson(res, 200, profile);
  } catch (error) {
    console.error("[gemini] generate:", error);
    return sendJson(res, 502, {
      error: error.message || "No se pudo generar el contenido",
    });
  }
}

module.exports = {
  handleGenerate,
  generateMunicipalityProfile,
};
