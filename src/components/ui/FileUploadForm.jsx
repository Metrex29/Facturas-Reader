import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaFilePdf, FaCheckCircle, FaExclamationCircle, FaUpload, FaTimes } from 'react-icons/fa';

const API_URL = 'http://localhost:3001/api';

const FileUploadForm = ({ onSuccess, onClose, noCard }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError(null);
    setSuccess(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
      setSuccess(false);
    }
  };

  const handleClickInput = () => {
    inputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }
    if (file.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF');
      return;
    }
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`El archivo es demasiado grande (${sizeMB}MB). El tamaño máximo permitido es 10MB.`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user?.id || '');
      formData.append('date', new Date().toISOString().split('T')[0]);
      formData.append('amount', '0');
      formData.append('description', `Factura subida: ${file.name}`);
      const uploadUrl = user?.id 
        ? `${API_URL}/invoices` 
        : `${API_URL}/invoices/anonymous`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir el archivo');
      }
      const result = await response.json();
      setSuccess(true);
      if (onSuccess) onSuccess(result);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setError(err.message || 'Error al subir el archivo');
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className={`w-full max-w-sm mx-auto flex flex-col items-center gap-4 bg-white dark:bg-gray-900 rounded-xl shadow-md p-6`}>
      <FaFilePdf className="text-5xl text-purple-600 mb-2 drop-shadow" />
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-0">Subir Factura</h2>
      <p className="text-gray-500 dark:text-gray-300 text-sm mb-2">Solo archivos PDF. Máx 10MB.</p>
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        <div
          className={`border-2 ${dragActive ? 'border-purple-600 bg-purple-50 dark:bg-purple-900' : 'border-gray-200 bg-gray-50 dark:bg-gray-800'} rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition`}
          onClick={handleClickInput}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            id="file-upload"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
            ref={inputRef}
          />
          <FaUpload className="text-3xl text-purple-500 mb-2" />
          <span className="text-gray-700 dark:text-gray-200 text-center">Arrastra tu PDF aquí o haz clic para seleccionar</span>
          {file && (
            <span className="mt-2 text-purple-700 font-medium text-sm">{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
          )}
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-600 rounded px-3 py-2">
            <FaExclamationCircle /> <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-600 rounded px-3 py-2">
            <FaCheckCircle /> <span>¡Factura subida exitosamente!</span>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition font-semibold"
            >
              <FaTimes /> Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow transition text-lg disabled:opacity-50"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
            ) : (
              <FaUpload />
            )}
            {loading ? 'Subiendo...' : 'Subir'}
          </button>
        </div>
      </form>
    </div>
  );

  if (noCard) return content;
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-lg w-full animate-fade-in border border-gray-100 dark:border-gray-800">
      {content}
    </div>
  );
};

export default FileUploadForm;