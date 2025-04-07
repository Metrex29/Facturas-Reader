import { DatabaseProvider } from './DatabaseProvider';
import { supabase } from '../../../lib/supabase';

export class SupabaseDatabaseProvider extends DatabaseProvider {
  async getUser(id) {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, created_at')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createUser(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: userData.id,
        email: userData.email,
        full_name: userData.fullName,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getInvoices(userId) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async createInvoice(invoiceData) {
    const { data, error } = await supabase
      .from('invoices')
      .insert([{
        user_id: invoiceData.userId,
        amount: invoiceData.amount,
        date: invoiceData.date,
        description: invoiceData.description,
        category: invoiceData.category,
        file_url: invoiceData.fileUrl,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateInvoice(id, invoiceData) {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        amount: invoiceData.amount,
        date: invoiceData.date,
        description: invoiceData.description,
        category: invoiceData.category,
        file_url: invoiceData.fileUrl
      })
      .match({ id })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteInvoice(id) {
    const { data, error } = await supabase
      .from('invoices')
      .delete()
      .match({ id });
    
    if (error) throw error;
    return data;
  }
}