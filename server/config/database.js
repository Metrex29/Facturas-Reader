const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'FacturasIA',
  password: 'Pass1234',
  port: 5432,
});

module.exports = pool;