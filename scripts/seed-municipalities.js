const fs = require("fs");
const path = require("path");
const { getMongoClient, DB_NAME } = require("../api/lib/mongoClient");
const {
  ALL_MUNICIPALITIES,
  COLLECTION_NAME,
  namesMatch,
} = require("../api/lib/municipalities");

function loadEnvFile() {
  const file = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

async function seedMunicipalities() {
  loadEnvFile();
  const client = await getMongoClient();
  const collection = client.db(DB_NAME).collection(COLLECTION_NAME);

  await collection.createIndex({ name: 1 }, { unique: true, sparse: true });

  const existing = await collection.find({}, { projection: { name: 1 } }).toArray();
  const now = new Date().toISOString();
  const operations = [];

  for (const name of ALL_MUNICIPALITIES) {
    const already = existing.some((item) => namesMatch(item.name, name));
    if (already) continue;
    operations.push({
      updateOne: {
        filter: { name },
        update: {
          $setOnInsert: {
            name,
            source: "seed",
            createdAt: now,
          },
        },
        upsert: true,
      },
    });
  }

  let upserted = 0;
  if (operations.length) {
    const result = await collection.bulkWrite(operations, { ordered: false });
    upserted = result.upsertedCount || 0;
  }

  const total = await collection.countDocuments();
  console.log(
    JSON.stringify({
      catalog: ALL_MUNICIPALITIES.length,
      existingBefore: existing.length,
      inserted: upserted,
      skipped: ALL_MUNICIPALITIES.length - operations.length,
      total,
    })
  );
}

seedMunicipalities()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seed-municipalities]", error.message);
    process.exit(1);
  });
