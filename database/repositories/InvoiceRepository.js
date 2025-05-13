export class InvoiceRepository {
  constructor(databaseProvider) {
    this.db = databaseProvider;
  }

  async getUserInvoices(userId) {
    return this.db.getInvoices(userId);
  }

  async createInvoice(invoiceData) {
    // Verificar si estamos enviando un archivo BLOB
    if (invoiceData.hasOwnProperty('file_blob')) {
      return this.db.uploadInvoiceBlob(invoiceData);
    }
    return this.db.createInvoice(invoiceData);
  }

  async updateInvoice(id, invoiceData) {
    return this.db.updateInvoice(id, invoiceData);
  }

  async deleteInvoice(id) {
    return this.db.deleteInvoice(id);
  }
}