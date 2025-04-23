export class InvoiceRepository {
  constructor(databaseProvider) {
    this.db = databaseProvider;
  }

  async getUserInvoices(userId) {
    return this.db.getInvoices(userId);
  }

  async createInvoice(invoiceData) {
    return this.db.createInvoice(invoiceData);
  }

  async updateInvoice(id, invoiceData) {
    return this.db.updateInvoice(id, invoiceData);
  }

  async deleteInvoice(id) {
    return this.db.deleteInvoice(id);
  }
}