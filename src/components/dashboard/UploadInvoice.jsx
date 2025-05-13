import { useState, useEffect } from 'react';
import FileUploadForm from '../ui/FileUploadForm';
import { useAuth } from '../../context/AuthContext';
import { invoicesApi } from '../../services/api/invoices';

const UploadInvoice = ({ onClose }) => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' o 'view'

  useEffect(() => {
    if (activeTab === 'view') {
      fetchInvoices();
    }
  }, [activeTab]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const invoicesData = await invoicesApi.getUserInvoices(user.id);
      setInvoices(invoicesData);
      setError(null);
    } catch (err) {
      console.error('Error al cargar facturas:', err);
      setError('Error al cargar las facturas');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async (result) => {
    console.log('Factura subida exitosamente:', result);
    // Actualizar la lista de facturas si estamos en la pestaña de visualización
    if (activeTab === 'view') {
      await fetchInvoices();
    }
  };

  const handleViewPDF = (invoice) => {
    // Abrir el PDF en una nueva pestaña
    window.open(`http://localhost:3001${invoice.file_url}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Mis Facturas</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Pestañas de navegación */}
        <div className="flex border-b mb-6">
          <button
            className={`py-2 px-4 ${activeTab === 'upload' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('upload')}
          >
            Subir Factura
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'view' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('view')}
          >
            Ver Facturas
          </button>
        </div>

        {/* Contenido de las pestañas */}
        {activeTab === 'upload' ? (
          <FileUploadForm 
            onSuccess={handleSuccess} 
            onClose={onClose} 
          />
        ) : (
          <div className="mt-4">
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center">{error}</div>
            ) : invoices.length === 0 ? (
              <div className="text-center text-gray-500">
                No tienes facturas subidas aún
              </div>
            ) : (
              <div className="grid gap-4">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-semibold">
                        Fecha: {new Date(invoice.date).toLocaleDateString()}
                      </p>
                      <p className="text-gray-600">
                        Monto: ${typeof invoice.amount === 'number' ? invoice.amount.toFixed(2) : (invoice.amount ? Number(invoice.amount).toFixed(2) : 'N/A')}
                      </p>
                      {invoice.description && (
                        <p className="text-gray-600 text-sm">
                          {invoice.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleViewPDF(invoice)}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      Ver PDF
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


export default UploadInvoice;