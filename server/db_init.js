const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/splitsphere';
const isProduction = process.env.NODE_ENV === 'production';

console.log('Using Connection String:', connectionString.replace(/:([^:@]+)@/, ':****@')); // Hide password in logs

const needsSSL = isProduction || connectionString.includes('sslmode=require') || connectionString.includes('neon.tech');

const pool = new Pool({
  connectionString,
  ssl: needsSSL ? { rejectUnauthorized: false } : false
});

async function runSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    console.error('schema.sql file not found at:', schemaPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Connecting to database and running tables schema creation...');

  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('🎉 SUCCESS: Database schema loaded successfully! All tables created.');
  } catch (err) {
    console.error('❌ ERROR: Database initialization failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

runSchema();
