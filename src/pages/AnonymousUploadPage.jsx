import React from 'react';
import AnonymousUpload from '../components/ui/AnonymousUpload';

const AnonymousUploadPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">FacturasIA</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sube tu factura sin necesidad de crear una cuenta
          </p>
        </div>
        
        <AnonymousUpload />
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            ¿Quieres guardar y gestionar tus facturas? 
            <a href="/login" className="font-medium text-purple-600 hover:text-purple-500">
              {' '}Crea una cuenta o inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnonymousUploadPage;