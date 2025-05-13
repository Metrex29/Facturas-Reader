/**
 * Script para ejecutar la migración SQL que adapta la base de datos al nuevo sistema de carga de archivos
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ruta al archivo de migración
const migrationFile = path.join(__dirname, '../migrations/update_file_storage.sql');

// Verificar que el archivo de migración existe
if (!fs.existsSync(migrationFile)) {
  console.error('Error: No se encontró el archivo de migración.');
  console.error(`Ruta esperada: ${migrationFile}`);
  process.exit(1);
}

// Obtener credenciales de la base de datos desde el archivo de configuración
const dbConfig = require('../config/database');
const { user, password, host, database, port } = dbConfig.pool.options;

console.log('Ejecutando migración para adaptar la base de datos al nuevo sistema de carga de archivos...');
console.log(`Archivo de migración: ${path.basename(migrationFile)}`);

// Comando para ejecutar la migración
const command = `psql -U ${user} -h ${host} -p ${port} -d ${database} -f "${migrationFile}"${password ? ` -W` : ''}`;

console.log('\nEjecutando comando (se le puede solicitar la contraseña):');
console.log(command.replace(/-W/g, ''));

// Ejecutar el comando
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('Error al ejecutar la migración:', error);
    process.exit(1);
  }
  
  if (stderr && !stderr.includes('NOTICE')) {
    console.error('Error en la migración:', stderr);
    process.exit(1);
  }
  
  console.log('\nResultado de la migración:');
  console.log(stdout);
  
  console.log('\nMigración completada con éxito.');
  console.log('La base de datos ha sido adaptada para el nuevo sistema de carga de archivos.');
  console.log('\nPróximos pasos:');
  console.log('1. Ejecute el script setup_uploads_folder.js para configurar la carpeta uploads:');
  console.log('   node server/scripts/setup_uploads_folder.js');
  console.log('2. Reinicie el servidor para aplicar los cambios.');
});