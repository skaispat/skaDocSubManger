import { useState } from 'react';
import { documentService, DocumentType } from '../../api/documentService';
import { storageService } from '../../api/storageService';
import { toast } from 'react-hot-toast';
import { X, Plus, Trash2, FileText, Eye } from 'lucide-react';
import PreviewModal from '../../components/PreviewModal';

interface Entry {
    id: string; // Internal temporary ID
    category: 'Company' | 'Calibration' | 'Project' | 'Compliance';
    // Common fields
    id_no: string;
    document_view: string | null;
    files: File[]; // Updated for multiple storage
    renewable: 'Yes' | 'No';
    renewable_date: string;
    status_of_document: string;
    validity_period: string;
    document_type: string;
    // Category specific
    document_name: string; // Company / Project
    instrument_name: string; // Calibration
    brand_name: string; // Calibration
    id_sr_no: string; // Calibration
    location: string; // Calibration
    certificate_number: string; // Calibration
    calibration_date: string; // Calibration
    whatsapp_no: string;
}

interface AddDocumentProps {
    isOpen: boolean;
    onClose: () => void;
    initialCategory?: 'Company' | 'Calibration' | 'Project' | 'Compliance';
    lockCategory?: boolean;
}

const AddDocument: React.FC<AddDocumentProps> = ({ isOpen, onClose, initialCategory = 'Company', lockCategory = false }) => {
    const [entries, setEntries] = useState<Entry[]>([
        {
            id: Math.random().toString(),
            category: initialCategory,
            id_no: '',
            document_view: null,
            files: [],
            renewable: 'No',
            renewable_date: '',
            status_of_document: 'Completed',
            validity_period: '',
            document_name: '',
            document_type: '',
            instrument_name: '',
            brand_name: '',
            id_sr_no: '',
            location: '',
            certificate_number: '',
            calibration_date: '',
            whatsapp_no: ''
        }
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState<{ files: string[], name: string }>({ files: [], name: '' });

    if (!isOpen) return null;

    const handleChange = (id: string, field: keyof Entry, value: any) => {
        setEntries(prev => prev.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                // Auto set status to Completed if Renewable is No
                if (field === 'renewable' && value === 'No') {
                    updated.status_of_document = 'Completed';
                }
                return updated;
            }
            return item;
        }));
    };

    const addEntry = () => {
        if (entries.length >= 10) {
            toast.error("Max 10 entries allowed");
            return;
        }
        setEntries(prev => [
            ...prev,
            {
                id: Math.random().toString(),
                category: initialCategory,
                id_no: '',
                document_view: null,
                files: [],
                renewable: 'No',
                renewable_date: '',
                status_of_document: 'Completed',
                validity_period: '',
                document_name: '',
                document_type: '',
                instrument_name: '',
                brand_name: '',
                id_sr_no: '',
                location: '',
                certificate_number: '',
                calibration_date: '',
                whatsapp_no: ''
            }
        ]);
    };

    const removeEntry = (id: string) => {
        if (entries.length === 1) return;
        setEntries(prev => prev.filter(item => item.id !== id));
    };

    const handleLocalPreview = (files: File[], documentName: string) => {
        if (files.length === 0) return;

        // Create temporary blob URLs for the local files
        const blobUrls = files.map(file => {
            const url = URL.createObjectURL(file);
            return file.type === 'application/pdf' ? `${url}#pdf` : url;
        });
        setPreviewData({
            files: blobUrls,
            name: documentName || 'New Document'
        });
        setIsPreviewOpen(true);

        // We should ideally revoke these URLs when modal closes, 
        // but since they are small in number, browser cleanup on unmount is usually okay.
        // For robustness, we will clear them in a bit.
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            for (const entry of entries) {
                let table: DocumentType = 'company_documents';
                let payload: any = {};
                let finalDocView = entry.document_view;

                // Handle multiple file uploads if present
                if (entry.files && entry.files.length > 0) {
                    const uploadToast = toast.loading(`Uploading ${entry.files.length} documents for ${entry.category}...`);

                    const uploadPromises = entry.files.map(file => storageService.uploadFile(file));
                    const uploadedUrls = await Promise.all(uploadPromises);

                    toast.dismiss(uploadToast);

                    const validUrls = uploadedUrls.filter(url => url !== null) as string[];

                    if (validUrls.length === 0) {
                        toast.error(`Failed to upload files for ${entry.category}`);
                        setIsSubmitting(false);
                        return;
                    }

                    finalDocView = validUrls.join(',');
                }

                // id_no is auto-generated by the database as sequential numbers (1, 2, 3...)

                if (entry.category === 'Calibration') {
                    table = 'calibration_certificate';
                    payload = {
                        instrument_name: entry.instrument_name,
                        document_view: finalDocView,
                        brand_name: entry.brand_name,
                        id_sr_no: entry.id_sr_no,
                        location: entry.location,
                        certificate_number: entry.certificate_number,
                        renewable: entry.renewable,
                        renewable_date: entry.renewable_date || null,
                        calibration_date: entry.calibration_date || null,
                        status_of_document: entry.status_of_document,
                        validity_period: entry.validity_period,
                        whatsapp_no: entry.whatsapp_no
                    };
                } else if (entry.category === 'Project') {
                    table = 'project_approval';
                    payload = {
                        document_name: entry.document_name,
                        document_view: finalDocView,
                        renewable: entry.renewable,
                        renewable_date: entry.renewable_date || null,
                        status_of_document: entry.status_of_document,
                        validity_period: entry.validity_period,
                        whatsapp_no: entry.whatsapp_no
                    };
                } else if (entry.category === 'Compliance') {
                    table = 'compliance_documents';
                    payload = {
                        document_name: entry.document_name,
                        document_view: finalDocView,
                        renewable: entry.renewable,
                        renewable_date: entry.renewable_date || null,
                        status_of_document: entry.status_of_document,
                        validity_period: entry.validity_period,
                        document_type: entry.document_type,
                        whatsapp_no: entry.whatsapp_no
                    };
                } else {
                    table = 'company_documents';
                    payload = {
                        document_name: entry.document_name,
                        document_view: finalDocView,
                        renewable: entry.renewable,
                        renewable_date: entry.renewable_date || null,
                        status_of_document: entry.status_of_document,
                        validity_period: entry.validity_period,
                        whatsapp_no: entry.whatsapp_no
                    };
                }

                await documentService.create(table, payload);
            }

            toast.success("Records saved successfully");
            setEntries([
                {
                    id: Math.random().toString(),
                    category: initialCategory,
                    id_no: '',
                    document_view: null,
                    files: [],
                    renewable: 'No',
                    renewable_date: '',
                    status_of_document: 'Completed',
                    validity_period: '',
                    document_name: '',
                    document_type: '',
                    instrument_name: '',
                    brand_name: '',
                    id_sr_no: '',
                    location: '',
                    certificate_number: '',
                    calibration_date: '',
                    whatsapp_no: ''
                }
            ]);
            onClose();
        } catch (err: any) {
            toast.error("Database Error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto font-sans">
            <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="flex gap-3 px-4 sm:px-6 md:px-8 py-4 border-t border-gray-100 bg-gray-50">                    <div>
                    <h2 className="text-md font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2">
                        <Plus className="text-red-600" size={22} />
                        Add Records
                    </h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Multi-Document Entry System</p>
                </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto no-scrollbar bg-white">
                    <form id="supabase-add-form" onSubmit={handleSubmit} className="space-y-6">
                        {entries.map((entry, index) => (
                            <div key={entry.id} className="relative p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-gray-100 bg-gray-50/20 space-y-4">

                                {/* Header */}
                                {!lockCategory && (
                                    <div className="flex flex-wrap gap-2 justify-between items-center">
                                        <div className="flex flex-wrap bg-white p-1 rounded-lg border border-gray-100 shadow-sm">
                                            {(['Company', 'Calibration', 'Project', 'Compliance'] as const).map(cat => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => handleChange(entry.id, 'category', cat)}
                                                    className={`px-2 sm:px-3 py-1 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all ${entry.category === cat
                                                        ? 'bg-red-600 text-white shadow-sm'
                                                        : 'text-gray-400 hover:text-gray-900'
                                                        }`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Form Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">

                                    {entry.category === 'Calibration' ? (
                                        <>
                                            {[
                                                ['Instrument', 'instrument_name'],
                                                ['Brand', 'brand_name'],
                                                ['Calibration Date', 'calibration_date', 'date'],
                                                ['Serial No (DB)', 'id_sr_no'],
                                                ['Location', 'location'],
                                                ['Cert Number', 'certificate_number']
                                            ].map(([label, field, type = 'text']) => (
                                                <div key={field} className="space-y-1">
                                                    <label className="text-[10px] sm:text-xs font-bold text-gray-900 uppercase tracking-wider">
                                                        {label}
                                                    </label>
                                                    <input
                                                        type={type}
                                                        className="w-full p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white border border-gray-300 focus:border-red-500 outline-none text-sm sm:text-base font-semibold text-gray-900"
                                                        value={entry[field]}
                                                        onChange={e => handleChange(entry.id, field, e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div className={`${entry.category === 'Compliance' ? 'sm:col-span-2' : 'sm:col-span-2 md:col-span-3'} space-y-1`}>
                                            <label className="text-[10px] sm:text-xs font-bold text-gray-900 uppercase tracking-wider">
                                                Document Name
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white border border-gray-300 focus:border-red-500 outline-none text-sm sm:text-base font-semibold text-gray-900"
                                                value={entry.document_name}
                                                onChange={e => handleChange(entry.id, 'document_name', e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {/* Dropdowns */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] sm:text-xs font-bold uppercase">Renewable</label>
                                        <select
                                            className="w-full p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-gray-300 text-sm sm:text-base font-semibold"
                                            value={entry.renewable}
                                            onChange={e => handleChange(entry.id, 'renewable', e.target.value)}
                                        >
                                            <option value="No">No</option>
                                            <option value="Yes">Yes</option>
                                        </select>
                                    </div>

                                    {entry.renewable === 'Yes' && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] sm:text-xs font-bold uppercase">Renew Date</label>
                                            <input
                                                type="date"
                                                className="w-full p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-gray-300 text-sm sm:text-base font-semibold"
                                                value={entry.renewable_date}
                                                onChange={e => handleChange(entry.id, 'renewable_date', e.target.value)}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        <label className="text-[10px] sm:text-xs font-bold uppercase">Status</label>
                                        <select
                                            className="w-full p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-gray-300 text-sm sm:text-base font-semibold"
                                            value={entry.status_of_document}
                                            onChange={e => handleChange(entry.id, 'status_of_document', e.target.value)}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] sm:text-xs font-bold uppercase">Validity</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-gray-300 text-sm sm:text-base font-semibold"
                                            value={entry.validity_period}
                                            onChange={e => handleChange(entry.id, 'validity_period', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] sm:text-xs font-bold uppercase">WhatsApp No (For Alerts)</label>
                                        <input
                                            type="tel"
                                            placeholder="e.g. 919876543210"
                                            className="w-full p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-gray-300 text-sm sm:text-base font-semibold"
                                            value={entry.whatsapp_no}
                                            onChange={e => handleChange(entry.id, 'whatsapp_no', e.target.value)}
                                        />
                                    </div>

                                    {/* File Upload */}
                                    <div className="sm:col-span-2 space-y-2">
                                        <label className="text-[10px] sm:text-xs font-bold flex justify-between">
                                            Upload
                                            {entry.files.length > 0 && (
                                                <span className="text-red-600">{entry.files.length}</span>
                                            )}
                                        </label>

                                        <label
                                            htmlFor={`file-${entry.id}`}
                                            className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed cursor-pointer text-sm"
                                        >
                                            <Plus size={16} />
                                            Select Files
                                        </label>

                                        <input
                                            type="file"
                                            multiple
                                            id={`file-${entry.id}`}
                                            className="hidden"
                                            onChange={e => {
                                                const newFiles = e.target.files ? Array.from(e.target.files) : [];
                                                handleChange(entry.id, 'files', [...entry.files, ...newFiles]);
                                            }}
                                        />

                                        {entry.files.length > 0 && (
                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                                {entry.files.map((file, fIdx) => (
                                                    <div key={fIdx} className="flex justify-between items-center text-xs p-2 bg-white rounded-lg border">
                                                        <span className="truncate max-w-[60%]">{file.name}</span>
                                                        <div className="flex gap-6">
                                                            <button type="button" onClick={() => handleLocalPreview(entry.files)}>
                                                                <Eye size={14} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const updatedFiles = entry.files.filter((_, i) => i !== fIdx);
                                                                    handleChange(entry.id, 'files', updatedFiles);
                                                                }}
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add Button */}
                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={addEntry}
                                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border text-xs font-bold uppercase"
                            >
                                <Plus size={16} />
                                Add Record
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex gap-4 px-8 py-6 border-t border-gray-100 bg-gray-50">
                    <button type="button" onClick={onClose} className="flex-1 py-3 px-6 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-gray-900 transition-all">
                        Dismiss
                    </button>
                    <button
                        type="submit"
                        form="supabase-add-form"
                        disabled={isSubmitting}
                        className={`flex-[2] flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-black transition-all ${isSubmitting ? 'opacity-50' : ''}`}
                    >
                        {isSubmitting ? 'Syncing...' : 'Save'}
                    </button>
                </div>
            </div>

            <PreviewModal
                isOpen={isPreviewOpen}
                onClose={() => {
                    // Revoke blob URLs to prevent memory leaks
                    previewData.files.forEach(url => {
                        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
                    });
                    setIsPreviewOpen(false);
                }}
                files={previewData.files}
                documentName={previewData.name}
            />
        </div>
    );
};

export default AddDocument;
