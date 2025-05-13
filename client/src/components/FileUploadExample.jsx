import React, { useState } from 'react';

const FileUploadExample = ({ userId }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  // Manejar cambio de archivo seleccionado
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setError(null);
  };

  // Manejar envío del formulario
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Crear objeto FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId || 'anonymous');
      formData.append('date', new Date().toISOString().split('T')[0]);
      formData.append('amount', '0'); // Valor por defecto, ajustar según necesidad
      formData.append('description', 'Subida desde componente React');
      
      // Determinar la URL según si es anónima o de usuario
      const uploadUrl = userId 
        ? 'http://localhost:3001/api/invoices' 
        : 'http://localhost:3001/api/invoices/anonymous';
      
      // Enviar petición al servidor
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        // No es necesario establecer Content-Type, el navegador lo hace automáticamente con FormData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir el archivo');
      }
      
      const data = await response.json();
      console.log('Archivo subido exitosamente:', data);
      setUploadedFile(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error al subir el archivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <h2>Subir Factura</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="file-upload">Seleccionar archivo:</label>
          <input
            id="file-upload"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={loading}
          />
          {file && (
            <p className="file-info">
              Archivo seleccionado: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>
        
        <button 
          type="submit" 
          disabled={loading || !file}
          className="upload-button"
        >
          {loading ? 'Subiendo...' : 'Subir Factura'}
        </button>
      </form>
      
      {error && <p className="error-message">{error}</p>}
      
      {uploadedFile && (
        <div className="upload-success">
          <h3>¡Archivo subido exitosamente!</h3>
          <p>ID de factura: {uploadedFile.id}</p>
          <p>Nombre del archivo: {uploadedFile.file_name}</p>
          
          {/* Enlace para ver el archivo */}
          <a 
            href={`http://localhost:3001${uploadedFile.file_url}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="view-file-link"
          >
            Ver factura
          </a>
        </div>
      )}
    </div>
  );
};

export default FileUploadExample;