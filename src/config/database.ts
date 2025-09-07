import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const query = (text: string, params?: any[]): Promise<QueryResult> => pool.query(text, params);

const getClient = (): Promise<PoolClient> => pool.connect();

export default {
  query,
  getClient,
  pool
};