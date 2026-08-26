export const generateMunicipalityProfile = async (municipioName, stats = {}) => {
  const response = await fetch("/api/admin/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name: municipioName, stats }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "No se pudo generar el contenido");
  }
  return data;
};
