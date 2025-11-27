
import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const { rows } = await pool.query('SELECT config FROM global_settings WHERE id = 1');
      res.status(200).json(rows[0] || { config: {} });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  } else if (req.method === 'POST') {
    try {
      const { config } = req.body;
      await pool.query(
        'INSERT INTO global_settings (id, config) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET config = $1',
        [JSON.stringify(config)]
      );
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save settings' });
    }
  } else {
    res.status(405).end();
  }
}
