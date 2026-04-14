import React from 'react';
import { X, Mail, Send } from 'lucide-react';
import useDataStore from '../../store/dataStore';
import { shareService } from '../../api/shareService';
import { toast } from 'react-hot-toast';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'email' | 'whatsapp' | 'both' | null;
    documentId: string | null;
    documentName: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, documentId, documentName }) => {
    const { documents } = useDataStore();

    const [recipientPhone, setRecipientPhone] = React.useState('');

    if (!isOpen) return null;

    const handleShare = async (method: 'WhatsApp' | 'Email') => {
        const doc = documents.find(d => d.id === documentId);
        if (!doc) {
            toast.error("Document not found");
            return;
        }

        const fileUrl = doc.file || '';
        const finalMessage = `Document: ${documentName}\n\nLink: ${fileUrl}`;
        const shareNo = `SH-${Date.now().toString().slice(-6)}`;

        // --- Execute Redirection ---
        if (method === 'Email') {
            const subject = `Sharing Document: ${documentName}`;
            const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(finalMessage)}`;
            window.location.href = mailtoUrl;
        } else {
            // WhatsApp Direct vs Contact List
            const cleanNumber = recipientPhone.replace(/\D/g, '');
            const finalNumber = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
            const waUrl = finalNumber
                ? `https://wa.me/${finalNumber}?text=${encodeURIComponent(finalMessage)}`
                : `https://wa.me/?text=${encodeURIComponent(finalMessage)}`;
            window.open(waUrl, '_blank');
        }

        // --- Log to Supabase ---
        await shareService.logShare({
            share_no: shareNo,
            doc_id: documentId || '',
            doc_serial: doc.sn,
            doc_name: documentName,
            doc_file: fileUrl,
            shared_via: method,
            recipient_name: method === 'WhatsApp' && recipientPhone ? `Direct Chat` : 'Direct Share',
            contact_info: method === 'WhatsApp' && recipientPhone ? recipientPhone : 'N/A'
        });

        toast.success(`Opening ${method}...`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[280px] overflow-hidden animate-scale-in border border-gray-100 pb-2">
                {/* Header */}
                <div className="px-5 py-4 flex justify-between items-center border-b border-gray-50 bg-gray-50/50">
                    <h2 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Share Via</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-white rounded-lg transition-all text-gray-400 hover:text-red-500 shadow-sm border border-transparent hover:border-gray-50">
                        <X size={16} strokeWidth={3} />
                    </button>
                </div>

                {/* Compact Icons */}
                <div className="p-6 grid grid-cols-2 gap-4">
                    <button
                        onClick={() => handleShare('WhatsApp')}
                        className="group flex flex-col items-center gap-2 p-4 bg-white border-2 border-gray-50 hover:border-green-600 rounded-3xl transition-all hover:shadow-lg active:scale-90"
                    >
                        <div className="p-3 bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white rounded-2xl transition-all shadow-sm">
                            <Send size={24} strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">WhatsApp</span>
                    </button>

                    <button
                        onClick={() => handleShare('Email')}
                        className="group flex flex-col items-center gap-2 p-4 bg-white border-2 border-gray-50 hover:border-blue-600 rounded-3xl transition-all hover:shadow-lg active:scale-90"
                    >
                        <div className="p-3 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white rounded-2xl transition-all shadow-sm">
                            <Mail size={24} strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Email</span>
                    </button>
                </div>

                {/* Optional Number Input */}
                <div className="px-6 pb-6">
                    <div className="flex border-2 border-gray-500 rounded-2xl overflow-hidden focus-within:border-green-600 transition-all shadow-sm">
                        <span className="bg-gray-50 px-3 flex items-center text-[10px] font-black text-gray-500">+91</span>
                        <input
                            type="tel"
                            placeholder="Optional: Enter Number"
                            className="w-full p-3 text-[10px] font-black uppercase tracking-widest outline-none placeholder:text-gray-300"
                            value={recipientPhone}
                            onChange={(e) => setRecipientPhone(e.target.value)}
                        />
                    </div>
                    {/* <p className="text-[8px] font-bold text-gray-300 mt-2 uppercase text-center tracking-tighter">Enter number above for direct targeted chat</p> */}
                </div>

                <p className="text-center text-[11px] font-bold text-gray-600 uppercase tracking-tighter pb-4 border-t border-gray-50 pt-3">
                    Document: {documentName.slice(0, 25)}{documentName.length > 25 ? '...' : ''}
                </p>
            </div>
        </div>
    );
};

export default ShareModal;
