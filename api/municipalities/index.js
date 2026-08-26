/**
 * API endpoint for municipality data operations
 * GET: Get all municipalities or a specific one
 * POST: Create or update municipality data
 * DELETE: Delete municipality data
 */

import clientPromise from '../lib/mongodb';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { getSessionFromRequest } = require('../lib/adminAuth');

const DB_NAME = 'powersolarpr';
const COLLECTION_NAME = 'municipalities';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    switch (req.method) {
      case 'GET':
        return handleGet(req, res, collection);
      case 'POST':
        if (!getSessionFromRequest(req)) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        return handlePost(req, res, collection);
      case 'DELETE':
        if (!getSessionFromRequest(req)) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        return handleDelete(req, res, collection);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('MongoDB error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

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

async function handleGet(req, res, collection) {
  const { name } = req.query;

  if (name) {
    const municipality = await findMunicipality(collection, decodeURIComponent(name));
    if (!municipality) {
      return res.status(404).json({ error: 'Municipality not found' });
    }
    return res.status(200).json(serializeMunicipality(municipality));
  }

  const municipalities = await collection.find({}).toArray();
  const result = {};
  municipalities.forEach((municipality) => {
    result[municipality.name] = serializeMunicipality(municipality);
  });
  return res.status(200).json(result);
}

async function handlePost(req, res, collection) {
  const { name, ...data } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Municipality name is required' });
  }

  const municipalityData = {
    name,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  // Upsert: update if exists, insert if not
  const result = await collection.updateOne(
    { name },
    { $set: municipalityData },
    { upsert: true }
  );

  return res.status(200).json({
    success: true,
    message: result.upsertedCount > 0 ? 'Municipality created' : 'Municipality updated',
    data: municipalityData,
  });
}

async function handleDelete(req, res, collection) {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'Municipality name is required' });
  }

  const existing = await findMunicipality(collection, decodeURIComponent(name));
  if (!existing) {
    return res.status(404).json({ error: 'Municipality not found' });
  }

  await collection.deleteOne({ _id: existing._id });
  return res.status(200).json({ success: true, message: 'Municipality deleted' });
}

