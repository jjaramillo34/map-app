const API_BASE = "/api/admin/visit-lists";

const parseJson = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return {};
  return response.json();
};

export const getVisitLists = async () => {
  const response = await fetch(API_BASE, { credentials: "include" });
  if (!response.ok) {
    const data = await parseJson(response);
    throw new Error(data.error || "No se pudieron cargar las rutas");
  }
  return parseJson(response);
};

export const saveVisitList = async ({ name, source, groups, customers }) => {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, source, groups, customers }),
  });
  const data = await parseJson(response);
  if (!response.ok) {
    throw new Error(data.error || "No se pudo guardar la ruta");
  }
  return data.data;
};

export const deleteVisitList = async (id) => {
  const response = await fetch(`${API_BASE}?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await parseJson(response);
  if (!response.ok) {
    throw new Error(data.error || "No se pudo eliminar la ruta");
  }
};
