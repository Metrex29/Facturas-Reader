import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { invoicesApi } from '../../services/api/invoices';

const ViewInvoices = ({ onClose, onDelete }) => {
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

  const handleViewPDF = async (invoice) => {
    try {
      console.log('Attempting to view invoice PDF:', invoice);
      
      // Abrir el PDF en una nueva pestaña usando la URL completa del archivo
      if (invoice.file_url) {
        window.open(`http://localhost:3001${invoice.file_url}`, '_blank');
      } else {
        setError('No se encontró la URL del archivo para esta factura');}
    } catch (err) {
      console.error('View error:', err);
      setError('Error al abrir el PDF: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await invoicesApi.deleteInvoice(id);
      setInvoices(invoices.filter(inv => inv.id !== id));
      if (onDelete) onDelete(id);
    } catch (err) {
      setError('Error al borrar la factura');
      console.error('Error:', err);
    }
  };

  const renderValidationWarning = (invoice) => {
    if (!invoice.validation_info) return null;
    
    const validation = JSON.parse(invoice.validation_info);
    if (!validation.tieneDiscrepancia) return null;

    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Hay una discrepancia en la suma de los productos:
              <br />
              Suma calculada: {validation.sumaTotal.toFixed(2)}€
              <br />
              Importe real: {validation.importeReal.toFixed(2)}€
              <br />
              Diferencia: {validation.diferencia.toFixed(2)}€
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Ordenar facturas por fecha descendente antes de renderizarlas
  const sortedInvoices = [...invoices].sort((a, b) => {
    const fechaA = new Date(a.date);
    const fechaB = new Date(b.date);
    return fechaB - fechaA;
  });

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
          <div className="space-y-4">
            {sortedInvoices.map((invoice) => (
              <div key={invoice.id} className="border rounded-lg p-4">
                {renderValidationWarning(invoice)}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{invoice.original_name}</h3>
                    <p className="text-sm text-gray-500">
                      Subida el {invoice.date ? (isNaN(new Date(invoice.date)) ? "Fecha no disponible" : new Date(invoice.date).toLocaleDateString()) : "Fecha no disponible"}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <a
                      href={`/uploads/${invoice.filename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Ver PDF
                    </a>
                    <button
                      onClick={() => handleDelete(invoice.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {/* Mostrar análisis de productos si existe */}
                {invoice.analysis && (
                  <div className="mt-2">
                    <p className="font-semibold mb-1 text-purple-700">Productos extraídos por IA:</p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm border">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-2 py-1 border">Producto</th>
                            <th className="px-2 py-1 border">Categoría</th>
                            <th className="px-2 py-1 border">Precio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            console.log("Factura:", invoice);
                            let productos = [];
                            try {
                              let clean = invoice.analysis
                                .replace(/```json|```/g, '') // elimina los backticks y el prefijo json
                                .trim();
                              productos = JSON.parse(clean);
                              console.log("Análisis IA productos:", productos);
                            } catch (e) {
                              return (
                                <tr><td colSpan="3" className="text-red-500">Error al leer análisis IA</td></tr>
                              );
                            }
                            if (!Array.isArray(productos) || productos.length === 0) {
                              return (
                                <tr><td colSpan="3" className="text-gray-500">Sin productos detectados</td></tr>
                              );
                            }
                            return productos.map((prod, idx) => (
                              <tr key={idx}>
                                <td className="px-2 py-1 border">{prod.producto || prod.name || "Sin nombre"}</td>
                                <td className="px-2 py-1 border">{prod.categoria || prod.category || "Sin categoría"}</td>
                                <td className="px-2 py-1 border">{(prod.precio || prod.price ? (prod.precio || prod.price) + ' €' : "Sin precio")}</td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewInvoices;