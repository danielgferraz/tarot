
import { Pool } from '@neondatabase/serverless';

// Garante que temos uma única instância em ambiente serverless (cold start mitigation)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
