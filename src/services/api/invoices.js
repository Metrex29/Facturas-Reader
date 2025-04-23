const API_URL = 'http://localhost:3000/api';

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
      const response = await fetch(`${API_URL}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });
      if (!response.ok) {
        throw new Error('Error al crear la factura');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en createInvoice:', error);
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