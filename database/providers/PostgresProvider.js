import { DatabaseProvider } from './DatabaseProvider';

/**
 * Implementación de DatabaseProvider para PostgreSQL usando API REST
 */
export class PostgresProvider extends DatabaseProvider {
  constructor() {
    super();
    // Base URL for API - adjust if your backend is running on a different port
    this.apiUrl = 'http://localhost:3000/api';
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
}