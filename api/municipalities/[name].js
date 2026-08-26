/**
 * API endpoint for specific municipality operations
 * GET /api/municipalities/[name] - Get specific municipality
 * DELETE /api/municipalities/[name] - Delete specific municipality
 */

import clientPromise from '../lib/mongodb';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { getSessionFromRequest } = require('../lib/adminAuth');

const DB_NAME = 'powersolarpr';
const COLLECTION_NAME = 'municipalities';

function namesMatch(left, right) {
  return left.localeCompare(right, 'es', { sensitivity: 'base' }) === 0;
}

function serializeMunicipality(municipality) {
  if (!municipality) return municipality;
  return {
    ...municipality,
    _id: municipality._id ? String(municipality._id) : undefined,
  };
}

async function findMunicipality(collection, name) {
  const exact = await collection.findOne({ name });
  if (exact) return exact;

  const municipalities = await collection.find({}).toArray();
  return municipalities.find((item) => item.name && namesMatch(item.name, name));
}

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const name = decodeURIComponent(req.query.name);

    switch (req.method) {
      case 'GET':
        const municipality = await findMunicipality(collection, name);
        if (!municipality) {
          return res.status(404).json({ error: 'Municipality not found' });
        }
        return res.status(200).json(serializeMunicipality(municipality));

      case 'DELETE':
        if (!getSessionFromRequest(req)) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        const existing = await findMunicipality(collection, name);
        if (!existing) {
          return res.status(404).json({ error: 'Municipality not found' });
        }
        await collection.deleteOne({ _id: existing._id });
        return res.status(200).json({ success: true, message: 'Municipality deleted' });

      default:
        res.setHeader('Allow', ['GET', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('MongoDB error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

