import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { invoicesApi } from '../../services/api/invoices';
import { motion, AnimatePresence } from 'framer-motion';

const ViewInvoices = ({ onClose, onDelete }) => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const modalRef = useRef();
  const [showConfirm, setShowConfirm] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

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

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Cerrar al hacer click fuera
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

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

  const handleAskDelete = (invoice) => {
    setInvoiceToDelete(invoice);
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      await invoicesApi.deleteInvoice(invoiceToDelete.id);
      setInvoices(invoices.filter(inv => inv.id !== invoiceToDelete.id));
      setShowConfirm(false);
      setInvoiceToDelete(null);
      if (onDelete) onDelete(invoiceToDelete.id);
    } catch (err) {
      setError('Error al borrar la factura');
      setShowConfirm(false);
      setInvoiceToDelete(null);
    }
  };

  const renderValidationWarning = (invoice) => {
    if (!invoice.validation_info) return null;
    
    const validation = typeof invoice.validation_info === 'string' 
      ? JSON.parse(invoice.validation_info) 
      : invoice.validation_info;
    
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onMouseDown={handleBackdropClick}>
      <AnimatePresence>
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-xl"
        >
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
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" /></svg>
              <span>{error}</span>
            </div>
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
                        href={invoice.file_url && invoice.file_url.startsWith('/uploads/') ? `http://localhost:3001${invoice.file_url}` : invoice.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Ver PDF
                      </a>
                      <button
                        onClick={() => handleAskDelete(invoice)}
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
                              let sumaProductos = 0;
                              let importeReal = null;
                              let precioDelNombre = null;
                              let diferenciaConNombre = null;
                              try {
                                let clean = invoice.analysis
                                  .replace(/```json|```/g, '')
                                  .trim();
                                productos = JSON.parse(clean);
                                // Calcular suma de productos
                                sumaProductos = productos.reduce((acc, prod) => acc + (parseFloat(prod.precio || prod.price || 0)), 0);
                                // Intentar obtener el importe real de la factura
                                importeReal = parseFloat(invoice.total || invoice.importeReal || invoice.amount || invoice.importe || 0);
                                if (!importeReal && invoice.validation_info) {
                                  try {
                                    const validation = typeof invoice.validation_info === 'string'
                                      ? JSON.parse(invoice.validation_info)
                                      : invoice.validation_info;
                                    if (validation.importeReal) importeReal = validation.importeReal;
                                    if (validation.precioDelNombre) precioDelNombre = validation.precioDelNombre;
                                    if (validation.diferenciaConNombre) diferenciaConNombre = validation.diferenciaConNombre;
                                  } catch {}
                                }
                                console.log("Análisis IA productos:", productos, "Suma:", sumaProductos, "Importe real:", importeReal);
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
                              // Renderizar productos
                              return (
                                <>
                                  {productos.map((prod, index) => (
                                    <tr key={index} className={prod.producto.includes("Otros") ? "bg-yellow-50" : ""}>
                                      <td className="px-2 py-1 border">{prod.producto}</td>
                                      <td className="px-2 py-1 border">{prod.categoria}</td>
                                      <td className="px-2 py-1 border text-right">{prod.precio?.toFixed(2)} €</td>
                                    </tr>
                                  ))}
                                  <tr className="bg-gray-50 font-semibold">
                                    <td colSpan="2" className="px-2 py-1 border text-right">Total productos:</td>
                                    <td className="px-2 py-1 border text-right">{sumaProductos.toFixed(2)} €</td>
                                  </tr>
                                  {/* Mostrar el importe real de la factura */}
                                  <tr className="bg-green-50 font-semibold">
                                    <td colSpan="2" className="px-2 py-1 border text-right">Importe real de la factura:</td>
                                    <td className="px-2 py-1 border text-right">{importeReal ? importeReal.toFixed(2) : 'N/A'} €</td>
                                  </tr>
                                  {precioDelNombre && (
                                    <>
                                      <tr className="bg-blue-50">
                                        <td colSpan="2" className="px-2 py-1 border text-right">Precio del nombre:</td>
                                        <td className="px-2 py-1 border text-right">{precioDelNombre.toFixed(2)} €</td>
                                      </tr>
                                      {diferenciaConNombre && Math.abs(diferenciaConNombre) > 0.01 && (
                                        <tr className="bg-yellow-50">
                                          <td colSpan="2" className="px-2 py-1 border text-right">Diferencia:</td>
                                          <td className="px-2 py-1 border text-right">{diferenciaConNombre.toFixed(2)} €</td>
                                        </tr>
                                      )}
                                    </>
                                  )}
                                </>
                              );
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
          {/* Modal de confirmación */}
          <AnimatePresence>
            {showConfirm && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40"
              >
                <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full flex flex-col items-center">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">¿Seguro que quieres borrar esta factura?</h3>
                  <p className="text-gray-600 mb-6 text-center">Esta acción no se puede deshacer.</p>
                  <div className="flex gap-4 w-full justify-center">
                    <button
                      onClick={() => { setShowConfirm(false); setInvoiceToDelete(null); }}
                      className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow"
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ViewInvoices;