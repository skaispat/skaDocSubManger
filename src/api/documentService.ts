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

export type DocumentType = 'calibration_certificate' | 'project_approval' | 'company_documents' | 'compliance_documents';

export const documentService = {
  async getAll(type: DocumentType): Promise<any[]> {
    const { data, error } = await supabase
      .from(type)
      .select('*');

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

  async delete(type: DocumentType, id_no: string): Promise<boolean> {
    const { error } = await supabase
      .from(type)
      .delete()
      .eq('id_no', id_no);

    if (error) {
      return false;
    }
    return true;
  }
};
