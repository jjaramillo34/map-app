/**
 * API endpoint for specific municipality operations
 * GET /api/municipalities/[name] - Get specific municipality
 * DELETE /api/municipalities/[name] - Delete specific municipality
 */

import clientPromise from '../lib/mongodb';

const DB_NAME = 'powersolarpr';
const COLLECTION_NAME = 'municipalities';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const name = decodeURIComponent(req.query.name);

    switch (req.method) {
      case 'GET':
        const municipality = await collection.findOne({ name });
        if (!municipality) {
          return res.status(404).json({ error: 'Municipality not found' });
        }
        return res.status(200).json(municipality);

      case 'DELETE':
        const result = await collection.deleteOne({ name });
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Municipality not found' });
        }
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

