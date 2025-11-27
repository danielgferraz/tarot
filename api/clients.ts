
import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // Fetch clients and join their readings
    try {
      const clientsRes = await pool.query('SELECT * FROM clients ORDER BY created_at DESC');
      const readingsRes = await pool.query('SELECT * FROM readings ORDER BY date DESC');
      
      const clients = clientsRes.rows.map(client => {
        const clientReadings = readingsRes.rows
          .filter(r => r.client_id === client.id)
          .map(r => ({
            ...r,
            aiConfigSnapshot: r.ai_config_snapshot // Map snake_case DB to camelCase Type
          }));
        
        return {
          id: client.id,
          name: client.name,
          email: client.email,
          notes: client.notes,
          readingsHistory: clientReadings
        };
      });

      res.status(200).json(clients);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Database error' });
    }
  } 
  else if (req.method === 'POST') {
    const { id, name, email, notes } = req.body;
    try {
      await pool.query(
        'INSERT INTO clients (id, name, email, notes) VALUES ($1, $2, $3, $4)',
        [id, name, email, notes]
      );
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create client' });
    }
  }
  else if (req.method === 'PUT') {
    const { id } = req.query;
    const { name, email, notes } = req.body;
    try {
      await pool.query(
        'UPDATE clients SET name = $1, email = $2, notes = $3 WHERE id = $4',
        [name, email, notes, id]
      );
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update client' });
    }
  }
  else if (req.method === 'DELETE') {
    const { id } = req.query;
    try {
      await pool.query('DELETE FROM clients WHERE id = $1', [id]);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete client' });
    }
  } 
  else {
    res.status(405).end();
  }
}
