const { Pool } = require('pg');

console.log('Iniciando configuración de la base de datos...');
console.log('Variables de entorno disponibles:', {
  DB_PASSWORD: process.env.DB_PASSWORD ? 'Definida' : 'No definida',
  NODE_ENV: process.env.NODE_ENV
});

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'FacturasIA',
  user: 'postgres',
  password: 'Test1234', // Reemplaza esto con tu contraseña real
  // Configuración explícita de codificación para resolver problemas de UTF8 a WIN1252
  client_encoding: 'UTF8',
  // Configuraciones adicionales para garantizar compatibilidad de caracteres
  query_timeout: 10000,
  statement_timeout: 10000,
  // Establecer el esquema de búsqueda predeterminado
  options: '-c search_path=public'
});

// Verificar la conexión
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error detallado al conectar:', {
      code: err.code,
      message: err.message,
      stack: err.stack
    });
    process.exit(1);
  } else {
    console.log('Conexión exitosa a la base de datos PostgreSQL');
    release();
  }
});

// Manejar errores de conexión
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de conexiones:', err);
});

module.exports = pool;