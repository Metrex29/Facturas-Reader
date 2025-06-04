import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import FileUploadForm from '../ui/FileUploadForm';
import { useAuth } from '../../context/AuthContext';
import { invoicesApi } from '../../services/api/invoices';

const UploadInvoice = ({ onClose }) => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' o 'view'
  const modalRef = useRef();
  const [showConfirm, setShowConfirm] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  useEffect(() => {
    if (activeTab === 'view') {
      fetchInvoices();
    }
  }, [activeTab]);

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

  // Nueva función para mostrar confirmación
  const handleAskDelete = (invoice) => {
    setInvoiceToDelete(invoice);
    setShowConfirm(true);
  };

  // Nueva función para confirmar borrado
  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      await invoicesApi.deleteInvoice(invoiceToDelete.id);
      setInvoices(invoices.filter(inv => inv.id !== invoiceToDelete.id));
      setShowConfirm(false);
      setInvoiceToDelete(null);
    } catch (err) {
      alert('Error al borrar la factura');
      setShowConfirm(false);
      setInvoiceToDelete(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-3xl">
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-8 pt-6 pb-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex-1">Mis Facturas</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl font-bold">&times;</button>
        </div>
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-8">
          <button
            className={`py-3 px-4 font-semibold text-base border-b-2 transition-colors duration-200 focus:outline-none ${activeTab === 'upload' ? 'border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'}`}
            onClick={() => setActiveTab('upload')}
          >
            Subir Factura
          </button>
          <button
            className={`py-3 px-4 font-semibold text-base border-b-2 transition-colors duration-200 focus:outline-none ${activeTab === 'view' ? 'border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'}`}
            onClick={() => setActiveTab('view')}
          >
            Ver Facturas
          </button>
        </div>
        <div className="flex-1 w-full flex items-center justify-center min-h-[400px] bg-white dark:bg-gray-900">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === 'upload' ? (
              <motion.div
                key="upload"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="w-full flex items-center justify-center"
              >
                <FileUploadForm onSuccess={handleSuccess} onClose={onClose} />
              </motion.div>
            ) : (
              <motion.div
                key="view"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="w-full"
              >
                <div className="mt-4 w-full px-6">
                  {loading ? (
                    <div className="flex justify-center items-center min-h-[200px]">
                      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
                    </div>
                  ) : error ? (
                    <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
                      <svg className="w-6 h-6 text-red-500 dark:text-red-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" /></svg>
                      <span>{error}</span>
                    </div>
                  ) : invoices.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-300">
                      No tienes facturas subidas aún
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700"
                        >
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-100">
                              Fecha: {new Date(invoice.date).toLocaleDateString()}
                            </p>
                            <p className="text-gray-600 dark:text-gray-300">
                              Monto: ${typeof invoice.amount === 'number' ? invoice.amount.toFixed(2) : (invoice.amount ? Number(invoice.amount).toFixed(2) : 'N/A')}
                            </p>
                            {invoice.description && (
                              <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {invoice.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewPDF(invoice)}
                              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                            >
                              Ver PDF
                            </button>
                            <button
                              onClick={() => handleAskDelete(invoice)}
                              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Borrar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
      </div>
    </div>
  );
};

export default UploadInvoice;