/**
 * API endpoint for municipality data operations
 * GET: Get all municipalities or a specific one
 * POST: Create or update municipality data
 * DELETE: Delete municipality data
 */

import clientPromise from '../lib/mongodb';

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
        return handlePost(req, res, collection);
      case 'DELETE':
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

async function handleGet(req, res, collection) {
  const { name } = req.query;

  if (name) {
    // Get specific municipality
    const municipality = await collection.findOne({ name: decodeURIComponent(name) });
    if (!municipality) {
      return res.status(404).json({ error: 'Municipality not found' });
    }
    return res.status(200).json(municipality);
  } else {
    // Get all municipalities
    const municipalities = await collection.find({}).toArray();
    const result = {};
    municipalities.forEach(m => {
      result[m.name] = m;
    });
    return res.status(200).json(result);
  }
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

  const result = await collection.deleteOne({ name: decodeURIComponent(name) });

  if (result.deletedCount === 0) {
    return res.status(404).json({ error: 'Municipality not found' });
  }

  return res.status(200).json({ success: true, message: 'Municipality deleted' });
}

