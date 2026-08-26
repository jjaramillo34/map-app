const { getSessionFromRequest, readJsonBody, sendJson } = require("./adminAuth");

const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-3.5-flash",
];

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

async function callGemini(prompt, { json = false } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
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
        lastError = new Error(
          data.error?.message || `Gemini API error: ${response.status}`
        );
        continue;
      }

      const text = extractText(data);
      if (!text) {
        lastError = new Error("Gemini no devolvió contenido");
        continue;
      }
      return json ? parseJsonContent(text) : text;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Gemini API error");
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

async function generateMunicipalityProfile(municipioName, stats = {}) {
  const prompt = `Eres un experto en municipios de Puerto Rico, energía solar y desarrollo de mercado.

Genera un JSON para el municipio de ${municipioName}, Puerto Rico.

${statsBlock(stats)}

Requisitos:
- Español profesional y atractivo
- Usa Censo de EE.UU. (especifica el año, preferiblemente 2020) y Wikipedia
- Incluye datos demográficos, ingresos, educación, vivienda y empleo
- Destaca el potencial solar y el contexto comercial local
- pointsOfInterest: 3-5 lugares concretos (playas, plazas, parques industriales, hospitales, centros comerciales, corredores, sitios históricos) que ayuden a un vendedor de energía solar a entender el territorio
- solarOpportunity: 2-3 frases sobre por qué este municipio es una oportunidad de mercado solar (tejados, turismo, comercio, resiliencia, ingresos)

Responde SOLO con JSON válido:
{
  "description": "descripción de 3-5 párrafos separados por \\n\\n",
  "tags": ["tag1", "tag2", "tag3"],
  "highlights": ["dato 1", "dato 2", "dato 3"],
  "funFact": "dato curioso",
  "pointsOfInterest": ["Lugar — por qué importa", "Lugar 2 — por qué importa"],
  "solarOpportunity": "oportunidad de mercado solar",
  "sources": ["US Census Bureau 2020", "Wikipedia - ${municipioName}"],
  "censusYear": "2020"
}`;

  const profile = await callGemini(prompt, { json: true });
  return {
    description: profile.description || "",
    tags: Array.isArray(profile.tags) ? profile.tags : [],
    highlights: Array.isArray(profile.highlights) ? profile.highlights : [],
    funFact: profile.funFact || "",
    pointsOfInterest: Array.isArray(profile.pointsOfInterest)
      ? profile.pointsOfInterest
      : [],
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
      body.stats || {}
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
