import { DatabaseProvider } from './DatabaseProvider';

/**
 * Implementación de DatabaseProvider para PostgreSQL usando API REST
 */
export class PostgresProvider extends DatabaseProvider {
  constructor() {
    super();
    // Base URL for API - adjust if your backend is running on a different port
    this.apiUrl = 'http://localhost:3001/api';
  }

  async getUser(id) {
    const response = await fetch(`${this.apiUrl}/users/${id}`);
    if (!response.ok) throw new Error('Error al obtener usuario');
    return await response.json();
  }

  async createUser(userData) {
    const response = await fetch(`${this.apiUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Error al crear usuario');
    return await response.json();
  }

  async updateUser(id, userData) {
    const response = await fetch(`${this.apiUrl}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Error al actualizar usuario');
    return await response.json();
  }

  async getInvoices(userId) {
    const response = await fetch(`${this.apiUrl}/invoices?userId=${userId}`);
    if (!response.ok) throw new Error('Error al obtener facturas');
    return await response.json();
  }

  async createInvoice(invoiceData) {
    const response = await fetch(`${this.apiUrl}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData)
    });
    if (!response.ok) throw new Error('Error al crear factura');
    return await response.json();
  }

  async updateInvoice(id, invoiceData) {
    const response = await fetch(`${this.apiUrl}/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData)
    });
    if (!response.ok) throw new Error('Error al actualizar factura');
    return await response.json();
  }

  async deleteInvoice(id) {
    const response = await fetch(`${this.apiUrl}/invoices/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error al eliminar factura');
  }

  /**
   * Sube un archivo de factura como BLOB
   * @param {Object} invoiceData - Datos de la factura incluyendo el archivo
   * @returns {Promise<Object>} - Factura creada
   */
  async uploadInvoiceBlob(invoiceData) {
    // Para archivos BLOB, usamos FormData en lugar de JSON
    const formData = new FormData();
    
    // Convertir base64 a Blob si es necesario
    if (invoiceData.file_blob) {
      const byteCharacters = atob(invoiceData.file_blob);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Agregar el archivo y los demás campos al FormData
      formData.append('file', blob, invoiceData.file_name);
    }
    
    // Agregar los demás campos al FormData
    Object.keys(invoiceData).forEach(key => {
      if (key !== 'file_blob') {
        formData.append(key, invoiceData[key]);
      }
    });
    
    const response = await fetch(`${this.apiUrl}/invoices/upload-blob`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) throw new Error('Error al subir factura como BLOB');
    return await response.json();
  }
}