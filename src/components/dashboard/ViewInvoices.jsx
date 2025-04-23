import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { invoicesApi } from '../../services/api/invoices';

const ViewInvoices = ({ onClose }) => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const invoices = await invoicesApi.getUserInvoices(user.id);
        setInvoices(invoices);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError('Error al cargar las facturas');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [user]);

  const handleViewPDF = async (fileUrl) => {
    try {
      console.log('Attempting to view file:', fileUrl);
      
      // Para PostgreSQL local, simplemente mostramos la ruta del archivo
      // En una implementación real, necesitarías servir estos archivos desde un servidor
      alert(`Esta función está en desarrollo. Ruta del archivo: ${fileUrl}`);
      
      // Alternativa: si los archivos están en una carpeta pública
      // window.open(`/uploads/${fileUrl}`, '_blank');
    } catch (err) {
      console.error('View error:', err);
      console.error('File URL attempting to view:', fileUrl);
      setError('Error al abrir el PDF: ' + err.message);
    }
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
                    Monto: ${invoice.amount?.toFixed(2) || 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => handleViewPDF(invoice.file_url)}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Ver PDF
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewInvoices;