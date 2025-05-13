/**
 * Script para configurar la carpeta 'uploads' con los permisos adecuados
 * Este script verifica que la carpeta exista y tenga los permisos correctos
 */

const fs = require('fs');
const path = require('path');

// Ruta a la carpeta uploads
const uploadsDir = path.join(__dirname, '../uploads');

console.log('Configurando carpeta de uploads...');

// Verificar si la carpeta existe
if (!fs.existsSync(uploadsDir)) {
  console.log('La carpeta uploads no existe. Creándola...');
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Carpeta uploads creada correctamente.');
  } catch (error) {
    console.error('Error al crear la carpeta uploads:', error);
    process.exit(1);
  }
} else {
  console.log('La carpeta uploads ya existe.');
}

// Verificar permisos de escritura
try {
  // Intentar escribir un archivo de prueba
  const testFile = path.join(uploadsDir, '.permissions-test');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile); // Eliminar archivo de prueba
  console.log('La carpeta uploads tiene permisos de escritura correctos.');
} catch (error) {
  console.error('Error: La carpeta uploads no tiene permisos de escritura adecuados.');
  console.error('Por favor, configure manualmente los permisos de la carpeta:');
  if (process.platform === 'win32') {
    console.log('En Windows: Haga clic derecho en la carpeta > Propiedades > Seguridad > Editar > Agregar permisos de escritura');
  } else {
    console.log('En Linux/Mac: Ejecute "chmod 755 server/uploads"');
  }
  process.exit(1);
}

console.log('\nInstrucciones para ejecutar la migración SQL:');
console.log('1. Conéctese a su base de datos PostgreSQL');
console.log('2. Ejecute el archivo de migración:');
console.log('   psql -U [usuario] -d [nombre_base_datos] -f server/migrations/update_file_storage.sql');
console.log('\nConfiguración completada con éxito.');