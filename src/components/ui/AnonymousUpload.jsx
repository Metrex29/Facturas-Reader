import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { validateFile, readFileAsArrayBuffer, blobToBase64 } from '../../utils/fileUtils';

const API_URL = 'http://localhost:3001/api';

const AnonymousUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError(null);
    
    // Usar la utilidad de validación de archivos
    const validation = validateFile(selectedFile, {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['application/pdf']
    });
    
    if (!validation.valid) {
      setError(validation.error);
      setFile(null);
    } else {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setSuccess(false);
    try {
      let base64String;
      
      // Usar las utilidades para leer el archivo y convertirlo a base64
      try {
        // Leer el archivo como ArrayBuffer
        const arrayBuffer = await readFileAsArrayBuffer(file);
        
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          throw new Error('El archivo está vacío o no se pudo leer correctamente');
        }
        
        console.log(`Archivo leído correctamente. Tamaño del buffer: ${arrayBuffer.byteLength} bytes`);
        
        // Convertir ArrayBuffer a Base64 para enviar al servidor
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        
        if (blob.size === 0) {
          throw new Error('Error al crear el blob del archivo');
        }
        
        // Usar la utilidad mejorada para convertir a base64
        base64String = await blobToBase64(blob);
        
        if (!base64String) {
          throw new Error('Error al convertir el archivo a formato base64');
        }
        
        console.log('Starting anonymous upload process');
      } catch (conversionError) {
        console.error('Error en la conversión del archivo:', conversionError);
        throw new Error('Error al procesar el archivo: ' + conversionError.message);
      }
      
      // Crear registro de factura a través de la API con el BLOB
      const invoiceData = {
        file_blob: base64String, // Enviamos el PDF como base64
        date: new Date().toISOString().split('T')[0],
        amount: 0, // Valor por defecto, se actualizará después del análisis
        description: `Factura anónima: ${file.name}`,
        file_name: file.name
      };
      
      console.log('Enviando datos de factura anónima al servidor...');
      
      // Usar el endpoint específico para facturas anónimas
      const response = await fetch(`${API_URL}/invoices/anonymous`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir la factura');
      }

      const result = await response.json();
      console.log('Anonymous invoice record created:', result);
      setSuccess(true);
      setFile(null);
    } catch (err) {
      console.error('Full error details:', err);
      setError('Error al subir el archivo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Ya no necesitamos esta función, ahora usamos la utilidad importada
  
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 my-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Subir Factura Anónima</h2>
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Seleccionar PDF
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="w-full p-2 border rounded"
        />
      </div>

      {error && (
        <div className="mb-4 text-red-500 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 text-green-500 text-sm">
          ¡Factura subida exitosamente!
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Subiendo...' : 'Subir'}
        </button>
      </div>
    </div>
  );
};

export default AnonymousUpload;