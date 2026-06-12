const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Fallback connection string for local development if DATABASE_URL is not set
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/splitsphere';

const needsSSL = isProduction || connectionString.includes('sslmode=require') || connectionString.includes('neon.tech');

const pool = new Pool({
  connectionString,
  ssl: needsSSL ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log('PostgreSQL database pool connected successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected database client error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
