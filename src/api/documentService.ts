import { supabase } from '../lib/supabase';

// Base interface and category-specific interfaces to match SQL
export interface CalibrationCertificate {
  id_no: string;
  instrument_name: string;
  document_view: string;
  brand_name: string;
  id_sr_no: string;
  location: string;
  certificate_number: string;
  renewable: string;
  renewable_date: string;
  calibration_date: string;
  status_of_document: string;
  validity_period: string;
}

export interface ProjectApproval {
  id_no: string;
  document_name: string;
  document_view: string;
  renewable: string;
  renewable_date: string;
  status_of_document: string;
  validity_period: string;
}

export interface ComplianceDocument {
  id_no: string;
  document_name: string;
  document_view: string;
  renewable: string;
  renewable_date: string;
  status_of_document: string;
  validity_period: string;
  document_type: string;
}

export type DocumentType = 'calibration_certificate' | 'project_approval' | 'company_documents' | 'compliance_documents' | 'subscription';

export const documentService = {
  async getAll(type: DocumentType): Promise<any[]> {
    const { data, error } = await supabase
      .from(type)
      .select('*')
      .order('id_no', { ascending: false });

    if (error) {
      return [];
    }

    return data || [];
  },

  async create(type: DocumentType, item: any): Promise<boolean> {
    const { error } = await supabase
      .from(type)
      .insert([item]);

    if (error) {
      return false;
    }
    return true;
  },

  async update(type: DocumentType, id_no: string, updates: any): Promise<boolean> {
    const { error } = await supabase
      .from(type)
      .update(updates)
      .eq('id_no', id_no);

    if (error) {
      return false;
    }
    return true;
  },

  async logRenewal(table: string, data: any): Promise<boolean> {
    const { error } = await supabase
      .from(table)
      .insert([data]);

    if (error) {
      console.error(`Error logging renewal to ${table}:`, error);
      return false;
    }
    return true;
  },

  async getRenewalHistory(table: string, doc_id: string): Promise<any[]> {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('doc_id', doc_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching renewal history from ${table}:`, error);
      return [];
    }
    return data || [];
  }
};
