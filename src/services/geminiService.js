import catalog from "../data/geminiModels.json";

export const GEMINI_MODELS = catalog.models;
export const DEFAULT_GEMINI_MODEL = catalog.defaultModel;

const STORAGE_KEY = "adminGeminiModel";

export const getSavedGeminiModel = () => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (GEMINI_MODELS.some((item) => item.id === saved)) return saved;
  } catch {
    // ignore storage errors
  }
  return DEFAULT_GEMINI_MODEL;
};

export const saveGeminiModel = (model) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, model);
  } catch {
    // ignore storage errors
  }
};

export const getGeminiModelLabel = (model) =>
  GEMINI_MODELS.find((item) => item.id === model)?.label || model;

export const generateMunicipalityProfile = async (
  municipioName,
  stats = {},
  model = DEFAULT_GEMINI_MODEL
) => {
  const response = await fetch("/api/admin/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name: municipioName, stats, model }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "No se pudo generar el contenido");
  }
  return data;
};
