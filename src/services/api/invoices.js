const API_URL = 'http://localhost:3001/api';

export const invoicesApi = {
  async getUserInvoices(userId) {
    try {
      const response = await fetch(`${API_URL}/invoices/${userId}`);
      if (!response.ok) {
        throw new Error('Error al obtener las facturas');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en getUserInvoices:', error);
      throw error;
    }
  },

  async createInvoice(invoiceData) {
    try {
      // Verificamos si estamos enviando un archivo BLOB
      const isBlob = invoiceData.hasOwnProperty('file_blob');
      
      // Validar datos antes de enviar
      if (!invoiceData.user_id) {
        throw new Error('El ID de usuario es requerido');
      }
      
      if (isBlob) {
        // Validaciones específicas para archivos
        if (!invoiceData.file_blob) {
          throw new Error('El contenido del archivo es requerido');
        }
        
        if (!invoiceData.file_name) {
          throw new Error('El nombre del archivo es requerido');
        }
        
        // Validar el tipo de archivo
        if (invoiceData.file_type && invoiceData.file_type !== 'application/pdf') {
          throw new Error(`Tipo de archivo no válido: ${invoiceData.file_type}. Solo se permiten archivos PDF.`);
        }
        
        // Validar el tamaño del archivo (máximo 10MB)
        if (invoiceData.file_size && invoiceData.file_size > 10 * 1024 * 1024) {
          const sizeMB = (invoiceData.file_size / (1024 * 1024)).toFixed(2);
          throw new Error(`El archivo es demasiado grande (${sizeMB}MB). El tamaño máximo permitido es 10MB.`);
        }
        
        // Validar longitud del base64
        if (invoiceData.file_blob.length === 0) {
          throw new Error('El archivo está vacío');
        }
        
        if (invoiceData.file_blob.length > 15 * 1024 * 1024) { // ~15MB en base64
          throw new Error('El archivo codificado excede el tamaño máximo permitido');
        }
      }
      
      console.log(`Enviando factura para usuario: ${invoiceData.user_id}, tipo: ${isBlob ? 'BLOB' : 'URL'}`);
      if (isBlob) {
        console.log(`Detalles del archivo: nombre=${invoiceData.file_name}, tipo=${invoiceData.file_type || 'no especificado'}, tamaño=${invoiceData.file_size ? (invoiceData.file_size / 1024).toFixed(2) + 'KB' : 'no especificado'}`);
      }
      
      // Preparar la solicitud
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      };
      
      // Enviar la solicitud al servidor
      const response = await fetch(`${API_URL}/invoices`, requestOptions);
      
      // Manejar respuesta
      if (!response.ok) {
        let errorMessage = 'Error al crear la factura';
        let errorDetails = null;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          errorDetails = errorData.error || null;
          
          if (errorDetails) {
            console.error('Detalles del error:', errorDetails);
            
            // Mejorar mensajes de error específicos
            if (typeof errorDetails === 'string' && errorDetails.includes('tamaño')) {
              errorMessage = 'Error al procesar el archivo. El archivo excede el tamaño máximo permitido.';
            } else if (typeof errorDetails === 'string' && errorDetails.includes('formato')) {
              errorMessage = 'Error al procesar el archivo. El formato del archivo no es válido.';
            }
          }
        } catch (parseError) {
          console.error('Error al parsear respuesta de error:', parseError);
          // Si el status es 413 (Payload Too Large)
          if (response.status === 413) {
            errorMessage = 'El archivo es demasiado grande para ser procesado por el servidor.';
          }
        }
        
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en createInvoice:', error);
      console.error('Full error details:', error);
      throw error;
    }
  },

  async updateInvoice(id, invoiceData) {
    try {
      const response = await fetch(`${API_URL}/invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });
      if (!response.ok) {
        throw new Error('Error al actualizar la factura');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en updateInvoice:', error);
      throw error;
    }
  },

  async deleteInvoice(id) {
    try {
      const response = await fetch(`${API_URL}/invoices/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Error al eliminar la factura');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en deleteInvoice:', error);
      throw error;
    }
  },
};