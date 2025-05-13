/**
 * Script para verificar la configuración completa del sistema de carga de archivos
 * Este script comprueba:
 * - La existencia y permisos de la carpeta uploads
 * - La configuración del servidor para servir archivos estáticos
 * - La estructura de la base de datos
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dbConfig = require('../config/database');

// Crear una conexión a la base de datos
const pool = new Pool(dbConfig.pool.options);

// Ruta a la carpeta uploads
const uploadsDir = path.join(__dirname, '../uploads');

console.log('=== VERIFICACIÓN DE CONFIGURACIÓN DEL SISTEMA DE CARGA DE ARCHIVOS ===\n');

// Función principal asíncrona
async function verificarConfiguracion() {
  let erroresEncontrados = false;
  
  // 1. Verificar carpeta uploads
  console.log('1. Verificando carpeta uploads...');
  if (!fs.existsSync(uploadsDir)) {
    console.error('   ❌ ERROR: La carpeta uploads no existe.');
    console.log('      Ejecute: node server/scripts/setup_uploads_folder.js');
    erroresEncontrados = true;
  } else {
    console.log('   ✅ La carpeta uploads existe.');
    
    // Verificar permisos de escritura
    try {
      const testFile = path.join(uploadsDir, '.permissions-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log('   ✅ La carpeta uploads tiene permisos de escritura correctos.');
    } catch (error) {
      console.error('   ❌ ERROR: La carpeta uploads no tiene permisos de escritura adecuados.');
      console.log('      Ejecute: node server/scripts/setup_uploads_folder.js');
      erroresEncontrados = true;
    }
  }
  
  // 2. Verificar configuración del servidor
  console.log('\n2. Verificando configuración del servidor...');
  const serverFile = path.join(__dirname, '../index.js');
  if (!fs.existsSync(serverFile)) {
    console.error('   ❌ ERROR: No se encontró el archivo del servidor.');
    erroresEncontrados = true;
  } else {
    const serverContent = fs.readFileSync(serverFile, 'utf8');
    if (serverContent.includes("app.use('/uploads', express.static(")) {
      console.log('   ✅ El servidor está configurado para servir archivos estáticos desde /uploads.');
    } else {
      console.error('   ❌ ERROR: El servidor no está configurado para servir archivos estáticos desde /uploads.');
      console.log('      Añada la siguiente línea en server/index.js:');
      console.log('      app.use(\'uploads\', express.static(path.join(__dirname, \'uploads\')));');
      erroresEncontrados = true;
    }
  }
  
  // 3. Verificar estructura de la base de datos
  console.log('\n3. Verificando estructura de la base de datos...');
  try {
    // Verificar si existe la tabla invoices
    const tableResult = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices')"
    );
    
    if (!tableResult.rows[0].exists) {
      console.error('   ❌ ERROR: La tabla invoices no existe en la base de datos.');
      erroresEncontrados = true;
    } else {
      console.log('   ✅ La tabla invoices existe en la base de datos.');
      
      // Verificar columnas necesarias
      const columnsResult = await pool.query(
        "SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'invoices'"
      );
      
      const columns = columnsResult.rows.reduce((acc, col) => {
        acc[col.column_name] = {
          nullable: col.is_nullable === 'YES',
          type: col.data_type
        };
        return acc;
      }, {});
      
      // Verificar file_url
      if (!columns.file_url) {
        console.error('   ❌ ERROR: La columna file_url no existe en la tabla invoices.');
        erroresEncontrados = true;
      } else {
        if (columns.file_url.nullable) {
          console.error('   ❌ ERROR: La columna file_url permite valores NULL. Debe ser NOT NULL.');
          console.log('      Ejecute: node server/scripts/run_migration.js');
          erroresEncontrados = true;
        } else {
          console.log('   ✅ La columna file_url está configurada correctamente.');
        }
      }
      
      // Verificar file_blob
      if (!columns.file_blob) {
        console.error('   ❌ ERROR: La columna file_blob no existe en la tabla invoices.');
        erroresEncontrados = true;
      } else {
        if (!columns.file_blob.nullable) {
          console.error('   ❌ ERROR: La columna file_blob no permite valores NULL. Debe ser NULL.');
          console.log('      Ejecute: node server/scripts/run_migration.js');
          erroresEncontrados = true;
        } else {
          console.log('   ✅ La columna file_blob está configurada correctamente.');
        }
      }
      
      // Verificar file_name
      if (!columns.file_name) {
        console.error('   ❌ ERROR: La columna file_name no existe en la tabla invoices.');
        erroresEncontrados = true;
      } else {
        console.log('   ✅ La columna file_name existe en la tabla invoices.');
      }
    }
  } catch (error) {
    console.error('   ❌ ERROR al conectar con la base de datos:', error.message);
    erroresEncontrados = true;
  } finally {
    // Cerrar la conexión a la base de datos
    pool.end();
  }
  
  // Resumen final
  console.log('\n=== RESUMEN DE LA VERIFICACIÓN ===');
  if (erroresEncontrados) {
    console.error('❌ Se encontraron errores en la configuración.');
    console.log('   Por favor, corrija los errores indicados antes de continuar.');
    console.log('\nPasos para corregir los errores:');
    console.log('1. Ejecute la migración de la base de datos:');
    console.log('   node server/scripts/run_migration.js');
    console.log('2. Configure la carpeta uploads:');
    console.log('   node server/scripts/setup_uploads_folder.js');
    console.log('3. Reinicie el servidor después de realizar los cambios.');
  } else {
    console.log('✅ Todo está correctamente configurado para el sistema de carga de archivos.');
    console.log('   El sistema está listo para usar el nuevo método de carga de archivos con FormData.');
  }
}

// Ejecutar la función principal
verificarConfiguracion().catch(error => {
  console.error('Error durante la verificación:', error);
  process.exit(1);
});