import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://localhost:3001/api';

const FileUploadForm = ({ onSuccess, onClose }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    // Validar tipo de archivo (PDF)
    if (file.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF');
      return;
    }

    // Validar tamaño (máximo 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`El archivo es demasiado grande (${sizeMB}MB). El tamaño máximo permitido es 10MB.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Crear objeto FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user?.id || '');
      formData.append('date', new Date().toISOString().split('T')[0]);
      formData.append('amount', '0'); // Valor por defecto
      formData.append('description', `Factura subida: ${file.name}`);

      console.log('Enviando archivo con FormData...');
      console.log(`Archivo: ${file.name}, tipo: ${file.type}, tamaño: ${(file.size / 1024).toFixed(2)}KB`);
      
      // Determinar la URL según si es anónima o de usuario
      const uploadUrl = user?.id 
        ? `${API_URL}/invoices` 
        : `${API_URL}/invoices/anonymous`;

      // Enviar petición al servidor
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        // No establecer Content-Type, el navegador lo hace automáticamente con FormData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir el archivo');
      }

      const result = await response.json();
      console.log('Factura creada exitosamente:', result);
      
      setSuccess(true);
      if (onSuccess) onSuccess(result);
      
      // Limpiar el formulario después de éxito
      setFile(null);
      // Resetear el input de archivo
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error('Error al subir archivo:', err);
      setError(err.message || 'Error al subir el archivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <h2 className="text-2xl font-bold mb-4">Subir Factura</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="file-upload">
            Seleccionar PDF
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="w-full p-2 border rounded"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Archivo seleccionado: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
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

        <div className="flex justify-end gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Subiendo...' : 'Subir'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FileUploadForm;