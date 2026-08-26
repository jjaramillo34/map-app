export const STALE_PROFILE_DAYS = 90;

export const namesMatch = (left, right) =>
  String(left || "").localeCompare(String(right || ""), "es", {
    sensitivity: "base",
  }) === 0;

export const normalizePoi = (item) => {
  if (!item) return null;
  if (typeof item === "string") {
    const trimmed = item.trim();
    if (!trimmed) return null;
    const [name, ...rest] = trimmed.split(/\s+[—–-]\s+/);
    return {
      name: name.trim(),
      why: rest.join(" — ").trim(),
      lat: null,
      lng: null,
    };
  }
  if (typeof item === "object") {
    const name = String(item.name || item.title || "").trim();
    if (!name) return null;
    const lat = Number(item.lat);
    const lng = Number(item.lng);
    return {
      name,
      why: String(item.why || item.reason || "").trim(),
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
    };
  }
  return null;
};

export const normalizePoiList = (items = []) =>
  (Array.isArray(items) ? items : [])
    .map(normalizePoi)
    .filter(Boolean);

export const poiLabel = (item) => {
  const poi = normalizePoi(item);
  if (!poi) return "";
  return poi.why ? `${poi.name} — ${poi.why}` : poi.name;
};

export const hasPublicProfile = (profile) => {
  if (!profile) return false;
  return Boolean(
    String(profile.description || "").trim() ||
      String(profile.solarOpportunity || "").trim() ||
      normalizePoiList(profile.pointsOfInterest).length
  );
};

export const isStaleProfile = (profile, days = STALE_PROFILE_DAYS) => {
  if (!hasPublicProfile(profile)) return false;
  const updated = Date.parse(profile.updatedAt || "");
  if (!Number.isFinite(updated)) return true;
  return Date.now() - updated > days * 24 * 60 * 60 * 1000;
};

export const findProfile = (name, profiles = {}) => {
  if (profiles[name]) return profiles[name];
  const match = Object.entries(profiles).find(([key]) => namesMatch(key, name));
  return match ? match[1] : null;
};
