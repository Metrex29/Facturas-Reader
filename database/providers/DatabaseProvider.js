/**
 * Clase base abstracta para proveedores de base de datos
 * Define la interfaz que todos los proveedores deben implementar
 */
export class DatabaseProvider {
  /**
   * Obtiene un usuario por su ID
   * @param {string} id - ID del usuario
   * @returns {Promise<Object>} - Datos del usuario
   */
  async getUser(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Crea un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object>} - Usuario creado
   */
  async createUser(userData) {
    throw new Error('Method not implemented');
  }

  /**
   * Actualiza un usuario existente
   * @param {string} id - ID del usuario
   * @param {Object} userData - Datos actualizados
   * @returns {Promise<Object>} - Usuario actualizado
   */
  async updateUser(id, userData) {
    throw new Error('Method not implemented');
  }

  /**
   * Obtiene las facturas de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} - Lista de facturas
   */
  async getInvoices(userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Crea una nueva factura
   * @param {Object} invoiceData - Datos de la factura
   * @returns {Promise<Object>} - Factura creada
   */
  async createInvoice(invoiceData) {
    throw new Error('Method not implemented');
  }

  /**
   * Actualiza una factura existente
   * @param {string} id - ID de la factura
   * @param {Object} invoiceData - Datos actualizados
   * @returns {Promise<Object>} - Factura actualizada
   */
  async updateInvoice(id, invoiceData) {
    throw new Error('Method not implemented');
  }

  /**
   * Elimina una factura
   * @param {string} id - ID de la factura
   * @returns {Promise<void>}
   */
  async deleteInvoice(id) {
    throw new Error('Method not implemented');
  }
}