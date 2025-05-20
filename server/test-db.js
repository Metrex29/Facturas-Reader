const { Pool } = require('pg');

// Configuración simple de la base de datos
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'FacturasIA',
  user: 'postgres',
  password: 'Test1234'});

// Función para probar la conexión
async function testConnection() {
  try {
    console.log('Intentando conectar a la base de datos...');
    const client = await pool.connect();
    console.log('¡Conexión exitosa!');
    
    // Hacer una consulta simple
    const result = await client.query('SELECT NOW()');
    console.log('Resultado de la consulta:', result.rows[0]);
    
    // Liberar el cliente
    client.release();
  } catch (err) {
    console.error('Error al conectar:', err);
  } finally {
    // Cerrar el pool
    await pool.end();
  }
}

// Ejecutar la prueba
testConnection(); 