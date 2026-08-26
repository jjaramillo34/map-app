import React, { useEffect, useState } from "react";
import { Download, Loader2, Trash2, Route } from "lucide-react";
import { deleteVisitList, getVisitLists } from "../../services/visitLists";
import { downloadTextFile, visitListCsv } from "../../utils/territoryTools";

const AdminVisitLists = () => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLists = async () => {
    setLoading(true);
    setError("");
    try {
      setLists(await getVisitLists());
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar las rutas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLists();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar la ruta "${name}"?`)) return;
    try {
      await deleteVisitList(id);
      setLists((current) => current.filter((item) => item._id !== id));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center gap-2">
        <Route className="h-5 w-5 text-primary-600" />
        <h3 className="text-lg font-bold text-gray-900">Rutas guardadas</h3>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Las listas se crean desde el mapa de oportunidad (territorio, 15/30 min o cerca de mí) y agrupan por municipio y barrio, sin direcciones.
      </p>
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : lists.length === 0 ? (
        <p className="text-sm text-gray-500">Aún no hay rutas. Genera una lista en /oportunidad y pulsa Guardar ruta.</p>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => (
            <div key={list._id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{list.name}</p>
                  <p className="text-xs text-gray-500">
                    {list.customers?.toLocaleString?.() || list.customers || 0} clientes · {list.groups?.length || 0} barrios · {list.source || "mapa"} · {list.createdAt ? new Date(list.createdAt).toLocaleDateString("es-PR") : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      downloadTextFile(
                        `${list.name.replace(/\s+/g, "-").toLowerCase()}.csv`,
                        visitListCsv(list.groups || [])
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(list._id, list.name)}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </button>
                </div>
              </div>
              <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-sm text-gray-600">
                {(list.groups || []).slice(0, 12).map((group) => (
                  <li key={`${group.municipio}-${group.barrio}`} className="flex justify-between gap-2">
                    <span>
                      {group.barrio}
                      <span className="text-gray-400"> · {group.municipio}</span>
                    </span>
                    <span className="font-semibold">{group.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVisitLists;
