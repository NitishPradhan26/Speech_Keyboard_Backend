const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

const query = (text, params) => pool.query(text, params)

const getClient = () => pool.connect()

module.exports = {
  query,
  getClient,
  pool
}