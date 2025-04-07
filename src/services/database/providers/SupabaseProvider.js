import { DatabaseProvider } from './DatabaseProvider'
import { supabase } from '../../../lib/supabase'

export class SupabaseProvider extends DatabaseProvider {
  constructor() {
    super()
    this.client = supabase
  }

  async getUser(id) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  async createUser(userData) {
    const { data, error } = await this.client
      .from('users')
      .insert(userData)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async getInvoices(userId) {
    const { data, error } = await this.client
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
    
    if (error) throw error
    return data
  }

  async createInvoice(invoiceData) {
    const { data, error } = await this.client
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async updateInvoice(id, invoiceData) {
    const { data, error } = await this.client
      .from('invoices')
      .update(invoiceData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async deleteInvoice(id) {
    const { error } = await this.client
      .from('invoices')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  }
}