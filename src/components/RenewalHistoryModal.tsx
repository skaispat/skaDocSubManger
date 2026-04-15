import React, { useState } from 'react';
import { X, Calendar, FileText, Eye, History, ExternalLink, ArrowRight } from 'lucide-react';
import { formatDate } from '../utils/dateFormatter';
import PreviewModal from './PreviewModal';

interface RenewalHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: any[];
    documentName: string;
    type: 'document' | 'calibration' | 'subscription';
}

const RenewalHistoryModal: React.FC<RenewalHistoryModalProps> = ({ isOpen, onClose, history, documentName, type }) => {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState<{ files: string[], name: string }>({ files: [], name: '' });

    if (!isOpen) return null;

    const handlePreview = (fileLink: string | null) => {
        if (!fileLink) return;
        const files = fileLink.split(',').filter(f => f.trim() !== '');
        setPreviewData({ files, name: documentName });
        setIsPreviewOpen(true);
    };

    return (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <History size={18} className="text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-gray-950 uppercase tracking-widest leading-none">Renewal History</h3>
                            <p className="text-[11px] text-gray-700 font-bold uppercase tracking-tight truncate max-w-[200px] sm:max-w-xs mt-0.5">{documentName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-full transition-all shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white custom-scrollbar">
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 opacity-60">
                            <History size={48} className="mb-3 stroke-[1]" />
                            <p className="text-xs font-bold uppercase tracking-wider">No historical records found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((record, index) => (
                                <div key={record.id_no || index} className="group relative pl-6 pb-2 border-l-2 border-dashed border-gray-100 last:border-0 last:pb-0">
                                    {/* Timeline Dot */}
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-red-200 rounded-full group-hover:border-red-500 transition-colors z-10 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                                    </div>

                                    {/* Record Card */}
                                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3 sm:p-4 hover:border-red-100 hover:bg-white transition-all hover:shadow-sm">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400" />
                                                <span className="text-[11px] font-black text-gray-900 uppercase tracking-wider">
                                                    {formatDate(record.created_at)}
                                                </span>
                                            </div>
                                            {record.document_view && (
                                                <button 
                                                    onClick={() => handlePreview(record.document_view)}
                                                    className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-100 rounded-lg text-[10px] font-bold text-gray-600 hover:text-red-600 hover:border-red-200 transition-all shadow-sm w-fit"
                                                >
                                                    <Eye size={12} /> View Documents
                                                </button>
                                            )}
                                        </div>

                                        {/* Dynamic Grid based on type */}
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                            {type === 'document' && (
                                                <>
                                                    <div>
                                                        <p className="text-[11px] uppercase font-black text-gray-700 tracking-tighter mb-0.5">Previous Expiry</p>
                                                        <p className="text-[12px] font-bold text-gray-950">
                                                            {record.last_renewable_date ? formatDate(record.last_renewable_date) : 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] uppercase font-black text-gray-700 tracking-tighter mb-0.5">Renewed To</p>
                                                        <div className="flex items-center gap-1.5">
                                                            <ArrowRight size={10} className="text-gray-400" />
                                                            <p className="text-[11px] font-bold text-red-600">
                                                                {record.renewable_date ? formatDate(record.renewable_date) : 'Infinite'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {type === 'calibration' && (
                                                <>
                                                    <div className="col-span-2 grid grid-cols-2 gap-4 border-b border-gray-50 pb-2 mb-1">
                                                        <div>
                                                            <p className="text-[11px] uppercase font-black text-gray-700 tracking-tighter mb-0.5">Instrument</p>
                                                            <p className="text-[11px] font-bold text-gray-950">{record.instrument_name}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] uppercase font-black text-gray-700 tracking-tighter mb-0.5">Certificate #</p>
                                                            <p className="text-[11px] font-bold text-gray-950">{record.certificate_number}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] uppercase font-black text-gray-700 tracking-tighter mb-0.5">Last Expiry</p>
                                                        <p className="text-[12px] font-bold text-gray-950">{record.last_renewable_date ? formatDate(record.last_renewable_date) : 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] uppercase font-black text-gray-700 tracking-tighter mb-0.5">New Expiry</p>
                                                        <p className="text-[12px] font-bold text-red-600">{record.renewable_date ? formatDate(record.renewable_date) : 'N/A'}</p>
                                                    </div>
                                                </>
                                            )}

                                            {type === 'subscription' && (
                                                <>
                                                    <div>
                                                        <p className="text-[11px] uppercase font-black text-gray-700 tracking-tighter mb-0.5">Service</p>
                                                        <p className="text-[12px] font-bold text-gray-950">{record.service_name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] uppercase font-black text-gray-700 tracking-tighter mb-0.5">Price</p>
                                                        <p className="text-[12px] font-bold text-red-600">₹{record.price?.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] uppercase font-black text-gray-700 tracking-tighter mb-0.5">Frequency</p>
                                                        <p className="text-[12px] font-bold text-gray-950 uppercase tracking-widest">{record.frequency}</p>
                                                    </div>
                                                </>
                                            )}

                                            {record.validity_period && (
                                                <div className="col-span-2 mt-1">
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 rounded-md">
                                                        <p className="text-[8px] uppercase font-black text-gray-500 tracking-widest">Validity Period:</p>
                                                        <p className="text-[9px] font-bold text-gray-700">{record.validity_period}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 flex justify-end">
                    <button onClick={onClose} className="px-5 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-md active:scale-95">
                        Close
                    </button>
                </div>
            </div>

            <PreviewModal 
                isOpen={isPreviewOpen} 
                onClose={() => setIsPreviewOpen(false)} 
                files={previewData.files} 
                documentName={`Historical: ${previewData.name}`} 
            />
        </div>
    );
};

export default RenewalHistoryModal;
