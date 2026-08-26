import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Sparkles,
  Trophy,
} from "lucide-react";
import { generateMunicipalityProfile, getGeminiModelLabel, GEMINI_MODELS } from "../../services/geminiService";
import { saveMunicipalityData } from "../../services/municipalityData";
import { normalizePoiList, poiLabel } from "../../utils/municipalityProfile";
import { locatePoiList } from "../../utils/territoryTools";

const QueueTable = ({ title, icon: Icon, rows, empty, onOpen }) => (
  <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg">
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary-600" />
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
        {rows.length}
      </span>
    </div>
    {rows.length === 0 ? (
      <p className="text-sm text-gray-500">{empty}</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="pb-2">Municipio</th>
              <th className="pb-2 text-right">Score</th>
              <th className="pb-2 text-right">Clientes</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-t border-gray-100">
                <td className="py-2 font-medium text-gray-900">{row.name}</td>
                <td className="py-2 text-right font-semibold text-orange-700">
                  {row.gapScore ?? "—"}
                </td>
                <td className="py-2 text-right text-gray-600">
                  {(row.customers || 0).toLocaleString()}
                </td>
                <td className="py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onOpen(row.name)}
                    className="rounded-lg bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-800 hover:bg-primary-100"
                  >
                    Abrir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

const AdminCoverageQueue = ({
  missing,
  stale,
  topEmpty,
  geminiModel,
  getStats,
  onOpen,
  onSaved,
  onModelChange,
}) => {
  const [drafts, setDrafts] = useState([]);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");

  const pendingCount = useMemo(
    () => drafts.filter((item) => item.status === "ready").length,
    [drafts]
  );

  const runBulk = async () => {
    const targets = missing.slice(0, 10);
    if (!targets.length) return;
    setRunning(true);
    setDrafts(targets.map((item) => ({ ...item, status: "pending", profile: null, error: "" })));
    for (let i = 0; i < targets.length; i += 1) {
      const item = targets[i];
      setStatus(`Generando ${i + 1} de ${targets.length}: ${item.name}`);
      setDrafts((current) =>
        current.map((row, index) =>
          index === i ? { ...row, status: "generating" } : row
        )
      );
      try {
        const generated = await generateMunicipalityProfile(
          item.name,
          getStats(item.name),
          geminiModel
        );
        const profile = {
          ...generated,
          pointsOfInterest: await locatePoiList(
            normalizePoiList(generated.pointsOfInterest),
            item.name,
            process.env.REACT_APP_MAPBOX_TOKEN
          ),
        };
        const draft = { ...item, status: "ready", profile, error: "" };
        setDrafts((current) =>
          current.map((row, index) => (index === i ? draft : row))
        );
      } catch (error) {
        const draft = {
          ...item,
          status: "error",
          profile: null,
          error: error.message || "Error al generar",
        };
        setDrafts((current) =>
          current.map((row, index) => (index === i ? draft : row))
        );
      }
    }
    setStatus("");
    setRunning(false);
  };

  const persistDraft = async (draft) => {
    if (!draft?.profile) return;
    const success = await saveMunicipalityData(draft.name, {
      description: draft.profile.description,
      tags: draft.profile.tags,
      highlights: draft.profile.highlights,
      funFact: draft.profile.funFact,
      pointsOfInterest: normalizePoiList(draft.profile.pointsOfInterest),
      solarOpportunity: draft.profile.solarOpportunity,
      sources: draft.profile.sources,
      censusYear: draft.profile.censusYear,
    });
    if (!success) return;
    setDrafts((current) =>
      current.map((item) =>
        item.name === draft.name ? { ...item, status: "saved" } : item
      )
    );
    onSaved?.();
  };

  const saveDraft = async (name) => {
    const draft = drafts.find((item) => item.name === name);
    await persistDraft(draft);
  };

  const skipDraft = (name) => {
    setDrafts((current) =>
      current.map((item) =>
        item.name === name ? { ...item, status: "skipped" } : item
      )
    );
  };

  const saveAllReady = async () => {
    const ready = drafts.filter((item) => item.status === "ready");
    for (const draft of ready) {
      await persistDraft(draft);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-purple-100 bg-white p-5 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Generar huecos con Gemini</h3>
            <p className="mt-1 text-sm text-gray-500">
              Crea borradores de los 10 municipios con mayor score y sin perfil. Revisa antes de guardar.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="queue-gemini-model">
              Modelo de Gemini
            </label>
            <select
              id="queue-gemini-model"
              value={geminiModel}
              onChange={(event) => onModelChange?.(event.target.value)}
              disabled={running}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {GEMINI_MODELS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={runBulk}
              disabled={running || missing.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {running ? "Generando…" : `Generar ${Math.min(10, missing.length)} faltantes`}
            </button>
          </div>
        </div>
        {(status || drafts.length > 0) && (
          <p className="mt-3 text-sm text-gray-600">
            {status || `Modelo: ${getGeminiModelLabel(geminiModel)}`}
          </p>
        )}
        {drafts.length > 0 && (
          <div className="mt-4 space-y-3">
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={saveAllReady}
                className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white"
              >
                Guardar {pendingCount} revisados
              </button>
            )}
            {drafts.map((draft) => (
              <div
                key={draft.name}
                className="rounded-lg border border-gray-200 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{draft.name}</p>
                    <p className="text-xs text-gray-500">
                      Score {draft.gapScore ?? "—"} · {draft.status}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {draft.status === "ready" && (
                      <>
                        <button
                          type="button"
                          onClick={() => saveDraft(draft.name)}
                          className="rounded-lg bg-primary-600 px-3 py-1 text-xs font-semibold text-white"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => skipDraft(draft.name)}
                          className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700"
                        >
                          Omitir
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpen(draft.name)}
                      className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800"
                    >
                      Abrir editor
                    </button>
                  </div>
                </div>
                {draft.status === "error" && (
                  <p className="mt-2 text-sm text-red-600">{draft.error}</p>
                )}
                {draft.profile && (
                  <div className="mt-2 space-y-1 text-sm text-gray-700">
                    <p className="line-clamp-3">{draft.profile.solarOpportunity}</p>
                    {draft.profile.pointsOfInterest?.length > 0 && (
                      <p className="text-xs text-gray-500">
                        {draft.profile.pointsOfInterest.map(poiLabel).filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <QueueTable
          title="Sin perfil"
          icon={AlertCircle}
          rows={missing}
          empty="Todos los municipios tienen perfil público."
          onOpen={onOpen}
        />
        <QueueTable
          title="Perfiles viejos (90 días)"
          icon={Clock}
          rows={stale}
          empty="No hay perfiles viejos."
          onOpen={onOpen}
        />
        <QueueTable
          title="Mayor score sin copy"
          icon={Trophy}
          rows={topEmpty}
          empty="No hay huecos de oportunidad."
          onOpen={onOpen}
        />
      </div>
      <p className="flex items-center gap-2 text-xs text-gray-500">
        <CheckCircle className="h-4 w-4 text-green-600" />
        Un clic en Abrir carga el municipio en el editor para generar o guardar.
      </p>
    </div>
  );
};

export default AdminCoverageQueue;
