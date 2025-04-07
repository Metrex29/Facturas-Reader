import { SupabaseProvider } from './providers/SupabaseProvider';
import { InvoiceRepository } from './repositories/InvoiceRepository';

const databaseProvider = new SupabaseProvider();
export { databaseProvider };
export const invoiceRepository = new InvoiceRepository(databaseProvider)