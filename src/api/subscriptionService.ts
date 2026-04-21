import { supabase } from '../lib/supabase';

export interface Subscription {
  id_no: string;
  company_name: string;
  service_name: string;
  frequency: string;
  status: string;
  price: number;
  renewable_date?: string;
  whatsapp_no?: string;
  created_at?: string;
}

export const subscriptionService = {
  async getAll(): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from('subscription')
      .select('*')
      .order('id_no', { ascending: false });

    if (error) {
      return [];
    }

    return data || [];
  },

  async create(sub: Subscription): Promise<boolean> {
    const { error } = await supabase
      .from('subscription')
      .insert([sub]);

    if (error) {
      return false;
    }
    return true;
  },

  async update(id_no: string, updates: Partial<Subscription>): Promise<boolean> {
    const { error } = await supabase
      .from('subscription')
      .update(updates)
      .eq('id_no', id_no);

    if (error) {
      return false;
    }
    return true;
  },

  async delete(id_no: string): Promise<boolean> {
    const { error } = await supabase
      .from('subscription')
      .delete()
      .eq('id_no', id_no);

    if (error) {
      return false;
    }
    return true;
  }
};
