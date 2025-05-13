/**
 * Utilidades para el manejo de archivos y conversión a base64
 */

/**
 * Convierte un Blob a una cadena base64 con validación
 * @param {Blob} blob - El blob a convertir
 * @returns {Promise<string>} - Promesa que resuelve a la cadena base64
 */
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    // Validar que el blob sea válido
    if (!blob || blob.size === 0) {
      reject(new Error('El blob está vacío o no es válido'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        // Verificar que el resultado no sea nulo
        if (!reader.result) {
          reject(new Error('Error al leer el archivo: resultado vacío'));
          return;
        }
        
        // Extraer solo la parte de datos del base64 (eliminar el prefijo)
        const fullResult = reader.result;
        const base64String = fullResult.split(',')[1];
        
        // Validar que la cadena base64 sea válida
        if (!base64String || base64String.trim() === '') {
          reject(new Error('La cadena base64 generada está vacía'));
          return;
        }
        
        // Validar que la cadena base64 tenga un formato válido (caracteres válidos)
        const base64Regex = /^[A-Za-z0-9+/=]+$/;
        if (!base64Regex.test(base64String)) {
          reject(new Error('La cadena base64 contiene caracteres inválidos'));
          return;
        }
        
        // Verificar que la longitud sea múltiplo de 4 (requisito de base64)
        if (base64String.length % 4 !== 0) {
          reject(new Error('La cadena base64 tiene una longitud inválida'));
          return;
        }
        
        resolve(base64String);
      } catch (error) {
        console.error('Error al procesar el resultado de FileReader:', error);
        reject(new Error('Error al procesar el archivo: ' + error.message));
      }
    };
    
    reader.onerror = (error) => {
      console.error('Error en FileReader:', error);
      reject(new Error('Error al leer el archivo'));
    };
    
    // Usar readAsDataURL para obtener el base64
    reader.readAsDataURL(blob);
  });
};

/**
 * Valida un archivo antes de procesarlo
 * @param {File} file - El archivo a validar
 * @param {Object} options - Opciones de validación
 * @param {number} options.maxSize - Tamaño máximo en bytes
 * @param {string[]} options.allowedTypes - Tipos MIME permitidos
 * @returns {Object} - Resultado de la validación {valid, error}
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB por defecto
    allowedTypes = ['application/pdf'] // PDF por defecto
  } = options;
  
  // Validar que exista un archivo
  if (!file) {
    return {
      valid: false,
      error: 'No se ha seleccionado ningún archivo'
    };
  }
  
  // Validar el tipo de archivo
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no válido: ${file.type}. Tipos permitidos: ${allowedTypes.join(', ')}`
    };
  }
  
  // Validar el tamaño del archivo
  if (file.size > maxSize) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `El archivo es demasiado grande (${sizeMB}MB). El tamaño máximo permitido es ${maxSizeMB}MB.`
    };
  }
  
  // Si pasa todas las validaciones
  return {
    valid: true,
    error: null
  };
};

/**
 * Lee un archivo como ArrayBuffer
 * @param {File} file - El archivo a leer
 * @returns {Promise<ArrayBuffer>} - Promesa que resuelve al ArrayBuffer
 */
export const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    
    fileReader.onload = () => resolve(fileReader.result);
    fileReader.onerror = (error) => {
      console.error('Error al leer el archivo:', error);
      reject(new Error(`Error al leer el archivo: ${error.message || 'Error desconocido'}`));
    };
    
    fileReader.readAsArrayBuffer(file);
  });
};