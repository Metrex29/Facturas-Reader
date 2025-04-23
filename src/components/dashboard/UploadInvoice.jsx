import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { invoicesApi } from '../../services/api/invoices';

const UploadInvoice = ({ onClose }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Por favor, selecciona un archivo PDF válido');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      // Por ahora, solo simularemos la URL del archivo
      // En una implementación real, subirías el archivo a un servicio de almacenamiento
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Starting upload process for user:', user.id);

      // Simulación de subida de archivo
      console.log('File would be uploaded to:', filePath);

      // Crear registro de factura a través de la API
      const invoiceData = {
        user_id: user.id,
        file_url: filePath,
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        description: file.name
      };
      
      console.log('Creating invoice record:', invoiceData);
      
      // Usar el servicio API para crear la factura
      const result = await invoicesApi.createInvoice(invoiceData);

      console.log('Invoice record created:', result);
      onClose();
    } catch (err) {
      console.error('Full error details:', err);
      setError('Error al subir el archivo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // El resto del componente permanece igual
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Subir Factura</h2>
        
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

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Subiendo...' : 'Subir'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadInvoice;