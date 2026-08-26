function serializeMunicipality(municipality, { includePrivate = false } = {}) {
  if (!municipality) return municipality;
  const { _id, salesNotes, ...rest } = municipality;
  const payload = {
    ...rest,
    _id: _id ? String(_id) : undefined,
  };
  if (includePrivate) {
    payload.salesNotes = typeof salesNotes === "string" ? salesNotes : "";
  }
  return payload;
}

module.exports = { serializeMunicipality };
