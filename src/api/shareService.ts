import { supabase } from '../lib/supabase';

export interface ShareLog {
    id?: string;
    created_at?: string;
    share_no: string;
    doc_id: string;
    doc_serial: string;
    doc_name: string;
    doc_file: string;
    shared_via: 'Email' | 'WhatsApp';
    recipient_name: string;
    contact_info: string;
}

export const shareService = {
    async logShare(log: ShareLog): Promise<boolean> {
        const { error } = await supabase
            .from('share_logs')
            .insert([log]);

        if (error) {
            console.error('Error logging share:', error);
            return false;
        }
        return true;
    },

    async getHistory(): Promise<ShareLog[]> {
        const { data, error } = await supabase
            .from('share_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching share history:', error);
            return [];
        }

        return data || [];
    }
};
