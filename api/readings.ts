
import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const { clientId, reading } = req.body;
    try {
      await pool.query(
        `INSERT INTO readings (id, client_id, date, title, layout_name, layout_id, cards, interpretation, ai_config_snapshot) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          reading.id, clientId, reading.date, reading.title, 
          reading.layoutName, reading.layoutId, JSON.stringify(reading.cards), 
          reading.interpretation, JSON.stringify(reading.aiConfigSnapshot)
        ]
      );
      res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to save reading' });
    }
  }
  else if (req.method === 'PUT') {
    const { id } = req.query;
    const { reading } = req.body; // Expecting partial update usually, but handling full for now
    try {
        // Mostly used for updating Title
        await pool.query(
            'UPDATE readings SET title = $1 WHERE id = $2',
            [reading.title, id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update reading' });
    }
  }
  else if (req.method === 'DELETE') {
    const { id } = req.query;
    try {
      await pool.query('DELETE FROM readings WHERE id = $1', [id]);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete reading' });
    }
  }
  else {
    res.status(405).end();
  }
}
