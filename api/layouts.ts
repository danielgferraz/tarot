
import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM custom_layouts');
      const layouts = result.rows.filter(r => r.type === 'layout').map(r => r.data);
      const presets = result.rows.filter(r => r.type === 'preset').map(r => r.data);
      res.status(200).json({ layouts, presets });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch layouts' });
    }
  } 
  else if (req.method === 'POST') {
    const { layout, type } = req.body;
    try {
      await pool.query(
        'INSERT INTO custom_layouts (id, data, type) VALUES ($1, $2, $3)',
        [layout.id, JSON.stringify(layout), type]
      );
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save layout' });
    }
  }
  else if (req.method === 'DELETE') {
    const { id } = req.query;
    try {
      await pool.query('DELETE FROM custom_layouts WHERE id = $1', [id]);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete layout' });
    }
  }
  else {
    res.status(405).end();
  }
}
