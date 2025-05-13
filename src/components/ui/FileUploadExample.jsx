import { useState } from 'react';
import FileUploadForm from './FileUploadForm';

const FileUploadExample = () => {
  const [showForm, setShowForm] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleSuccess = (result) => {
    setUploadedFile(result);
    setShowForm(false);
  };

  return (
    <div className="max-w-md mx-auto my-8 p-4">
      {!showForm ? (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ejemplo de Carga de Archivos</h2>
          
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Subir Nueva Factura
          </button>
          
          {uploadedFile && (
            <div className="mt-6 p-4 border rounded bg-gray-50">
              <h3 className="font-bold text-lg mb-2">Factura Subida Exitosamente</h3>
              <p><strong>ID:</strong> {uploadedFile.id}</p>
              <p><strong>Nombre:</strong> {uploadedFile.file_name}</p>
              <p><strong>Fecha:</strong> {new Date(uploadedFile.date).toLocaleDateString()}</p>
              
              {uploadedFile.file_url && (
                <div className="mt-3">
                  <a 
                    href={`http://localhost:3001${uploadedFile.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Ver Archivo
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          <FileUploadForm 
            onSuccess={handleSuccess} 
            onClose={() => setShowForm(false)} 
          />
        </div>
      )}
    </div>
  );
};

export default FileUploadExample;