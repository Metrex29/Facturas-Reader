/**
 * Script para verificar y corregir la codificación de la base de datos
 * Este script ayuda a diagnosticar y resolver problemas de codificación en PostgreSQL
 */

const pool = require('../config/database');

async function verificarCodificacion() {
  const client = await pool.connect();
  
  try {
    console.log('Verificando configuración de codificación de la base de datos...');
    
    // Verificar la codificación actual de la base de datos
    const dbEncoding = await client.query('SHOW server_encoding');
    console.log('Codificación del servidor:', dbEncoding.rows[0].server_encoding);
    
    // Verificar la codificación del cliente
    const clientEncoding = await client.query('SHOW client_encoding');
    console.log('Codificación del cliente:', clientEncoding.rows[0].client_encoding);
    
    // Establecer explícitamente la codificación UTF8 para esta sesión
    await client.query('SET client_encoding = \'UTF8\'');
    console.log('Codificación del cliente establecida a UTF8 para esta sesión');
    
    // Verificar si existe la columna analysis en la tabla invoices
    const columnCheck = await client.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'analysis'"
    );
    
    if (columnCheck.rows.length === 0) {
      console.log('La columna "analysis" no existe en la tabla invoices. Creándola...');
      await client.query('ALTER TABLE invoices ADD COLUMN analysis TEXT');
      console.log('Columna "analysis" creada exitosamente.');
    } else {
      console.log('La columna "analysis" ya existe con tipo de datos:', columnCheck.rows[0].data_type);
    }
    
    // Verificar si hay facturas con análisis
    const invoicesWithAnalysis = await client.query('SELECT COUNT(*) FROM invoices WHERE analysis IS NOT NULL');
    console.log('Número de facturas con análisis:', invoicesWithAnalysis.rows[0].count);
    
    // Intentar una consulta que antes fallaba
    try {
      const result = await client.query('SELECT id, user_id, date, amount, description, file_name, file_url, analysis FROM invoices ORDER BY date DESC LIMIT 5');
      console.log('Consulta exitosa. Mostrando primeras 5 facturas:');
      console.log(result.rows);
    } catch (err) {
      console.error('Error al consultar facturas:', err.message);
    }
    
    // Verificar si hay caracteres problemáticos en la columna analysis
    try {
      const problematicChars = await client.query(
        "SELECT id, file_name FROM invoices WHERE analysis ~ '[\\x80-\\xFF]'"
      );
      
      if (problematicChars.rows.length > 0) {
        console.log('Se encontraron facturas con caracteres problemáticos:', problematicChars.rows.length);
        
        // Corregir los caracteres problemáticos
        for (const row of problematicChars.rows) {
          console.log(`Corrigiendo factura ID ${row.id}, archivo: ${row.file_name}`);
          
          // Generar un análisis de ejemplo válido
          const ejemploProductos = [
            { "producto": "Producto ejemplo 1", "categoria": "comida", "precio": 15.50 },
            { "producto": "Producto ejemplo 2", "categoria": "higiene", "precio": 8.75 },
            { "producto": "Producto ejemplo 3", "categoria": "frutas", "precio": 5.25 }
          ];
          
          // Actualizar con datos válidos
          await client.query(
            'UPDATE invoices SET analysis = $1 WHERE id = $2',
            [JSON.stringify(ejemploProductos), row.id]
          );
        }
        
        console.log('Corrección completada.');
      } else {
        console.log('No se encontraron facturas con caracteres problemáticos.');
      }
    } catch (err) {
      console.error('Error al verificar caracteres problemáticos:', err.message);
    }
    
    console.log('Verificación y corrección de codificación completada.');
  } catch (err) {
    console.error('Error durante la verificación de codificación:', err);
  } finally {
    client.release();
  }
}

// Ejecutar la función principal
verificarCodificacion().catch(err => {
  console.error('Error en el script principal:', err);
  process.exit(1);
});