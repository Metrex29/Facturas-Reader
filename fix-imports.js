// Script para corregir las rutas de importación en los archivos de Horizon UI Chakra
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para corregir las importaciones en un archivo
function fixImports(filePath) {
  try {
    // Leer el contenido del archivo
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Obtener la ruta relativa desde el archivo actual hasta la carpeta components
    const relativePath = path.relative(
      path.dirname(filePath),
      path.resolve(__dirname, 'horizon-ui-chakra/src/components')
    ).replace(/\\/g, '/');
    
    // Reemplazar las importaciones absolutas por relativas
    content = content.replace(
      /import\s+([^\s]+)\s+from\s+["']components\/card\/([^"']+)["']/g,
      `import $1 from "${relativePath}/card/$2"`
    );
    
    content = content.replace(
      /import\s+([^\s]+)\s+from\s+["']components\/menu\/([^"']+)["']/g,
      `import $1 from "${relativePath}/menu/$2"`
    );
    
    content = content.replace(
      /import\s+([^\s]+)\s+from\s+["']components\/icons\/([^"']+)["']/g,
      `import $1 from "${relativePath}/icons/$2"`
    );
    
    // Guardar el archivo modificado
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Corregidas importaciones en: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error al procesar ${filePath}:`, error);
    return false;
  }
}

// Función para recorrer un directorio y procesar los archivos
function processDirectory(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(directory, file.name);
    
    if (file.isDirectory()) {
      processDirectory(fullPath);
    } else if (
      (file.name.endsWith('.js') || file.name.endsWith('.jsx')) &&
      !file.name.startsWith('.')
    ) {
      // Leer el archivo para verificar si contiene importaciones absolutas
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('import') && content.includes('from "components/')) {
        fixImports(fullPath);
      }
    }
  }
}

// Directorio principal a procesar
const srcDir = path.join(__dirname, 'horizon-ui-chakra/src');
console.log(`🔍 Buscando archivos con importaciones absolutas en: ${srcDir}`);

// Iniciar el procesamiento
processDirectory(srcDir);
console.log('✨ Proceso completado');