import { useState } from 'react';
import { documentService, DocumentType } from '../../api/documentService';
import { storageService } from '../../api/storageService';
import { toast } from 'react-hot-toast';
import { X, Save, Plus, Trash2, FileText, Upload, FileUp, Eye } from 'lucide-react';
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
}

interface AddDocumentProps {
    isOpen: boolean;
    onClose: () => void;
    initialCategory?: 'Company' | 'Calibration' | 'Project' | 'Compliance';
}

const AddDocument: React.FC<AddDocumentProps> = ({ isOpen, onClose, initialCategory = 'Company' }) => {
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
            calibration_date: ''
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
                category: 'Company',
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
                calibration_date: ''
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
        const blobUrls = files.map(file => URL.createObjectURL(file));
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
                        validity_period: entry.validity_period
                    };
                } else if (entry.category === 'Project') {
                    table = 'project_approval';
                    payload = {
                        document_name: entry.document_name,
                        document_view: finalDocView,
                        renewable: entry.renewable,
                        renewable_date: entry.renewable_date || null,
                        status_of_document: entry.status_of_document,
                        validity_period: entry.validity_period
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
                        document_type: entry.document_type
                    };
                } else {
                    table = 'company_documents';
                    payload = {
                        document_name: entry.document_name,
                        document_view: finalDocView,
                        renewable: entry.renewable,
                        renewable_date: entry.renewable_date || null,
                        status_of_document: entry.status_of_document,
                        validity_period: entry.validity_period
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
                    calibration_date: ''
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
            <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2">
                            <Plus className="text-red-600" size={24} />
                            Add Records
                        </h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Multi-Document Entry System</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar bg-white">
                    <form id="supabase-add-form" onSubmit={handleSubmit} className="space-y-8">
                        {entries.map((entry, index) => (
                            <div key={entry.id} className="relative p-6 rounded-2xl border border-gray-100 bg-gray-50/20 space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex bg-white p-1 rounded-lg border border-gray-100 shadow-sm">
                                        {(['Company', 'Calibration', 'Project', 'Compliance'] as const).map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => handleChange(entry.id, 'category', cat)}
                                                className={`px-4 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${entry.category === cat ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-900'}`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                    <button type="button" onClick={() => removeEntry(entry.id)} className="text-gray-300 hover:text-red-600 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {/* ID No is now auto-generated and hidden */}

                                    {entry.category === 'Calibration' ? (
                                        <>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-900 uppercase tracking-wider ml-1">Instrument</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2.5 rounded-xl bg-white border border-gray-300 focus:border-red-500 transition-colors outline-none text-base font-bold text-gray-900"
                                                    value={entry.instrument_name}
                                                    onChange={e => handleChange(entry.id, 'instrument_name', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-900 uppercase tracking-wider ml-1">Brand</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2.5 rounded-xl bg-white border border-gray-300 focus:border-red-500 transition-colors outline-none text-base font-bold text-gray-900"
                                                    value={entry.brand_name}
                                                    onChange={e => handleChange(entry.id, 'brand_name', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-900 uppercase tracking-wider ml-1">Calibration Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full p-2.5 rounded-xl bg-white border border-gray-300 focus:border-red-500 transition-colors outline-none text-base font-bold text-gray-900"
                                                    value={entry.calibration_date}
                                                    onChange={e => handleChange(entry.id, 'calibration_date', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-900 uppercase tracking-wider ml-1">Serial No (DB)</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2.5 rounded-xl bg-white border border-gray-300 focus:border-red-500 transition-colors outline-none text-base font-bold text-gray-900"
                                                    value={entry.id_sr_no}
                                                    onChange={e => handleChange(entry.id, 'id_sr_no', e.target.value)}
                                                    placeholder="e.g. SR-001"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-900 uppercase tracking-wider ml-1">Location</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2.5 rounded-xl bg-white border border-gray-300 focus:border-red-500 transition-colors outline-none text-base font-bold text-gray-900"
                                                    value={entry.location}
                                                    onChange={e => handleChange(entry.id, 'location', e.target.value)}
                                                    placeholder="Main Lab"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-900 uppercase tracking-wider ml-1">Cert Number</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2.5 rounded-xl bg-white border border-gray-300 focus:border-red-500 transition-colors outline-none text-base font-bold text-gray-900"
                                                    value={entry.certificate_number}
                                                    onChange={e => handleChange(entry.id, 'certificate_number', e.target.value)}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className={`${entry.category === 'Compliance' ? 'md:col-span-2' : 'md:col-span-3'} space-y-1.5`}>
                                                <label className="text-xs font-bold text-gray-900 uppercase tracking-wider ml-1">Document Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full p-2.5 rounded-xl bg-white border border-gray-300 focus:border-red-500 transition-colors outline-none text-base font-bold text-gray-900"
                                                    value={entry.document_name}
                                                    onChange={e => handleChange(entry.id, 'document_name', e.target.value)}
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-900 uppercase tracking-wider ml-1">Renewable</label>
                                        <select
                                            className="w-full p-2.5 rounded-xl bg-white border border-gray-300 focus:border-red-500 transition-colors outline-none text-base font-bold text-gray-900 uppercase"
                                            value={entry.renewable}
                                            onChange={e => handleChange(entry.id, 'renewable', e.target.value)}
                                        >
                                            <option value="No">No</option>
                                            <option value="Yes">Yes</option>
                                        </select>
                                    </div>
                                    {entry.renewable === 'Yes' && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-900 uppercase tracking-wider ml-1">Renew Date</label>
                                            <input
                                                type="date"
                                                className="w-full p-2.5 rounded-xl bg-white border border-gray-300 focus:border-red-500 transition-colors outline-none text-base font-bold text-gray-900"
                                                value={entry.renewable_date}
                                                onChange={e => handleChange(entry.id, 'renewable_date', e.target.value)}
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-900 uppercase tracking-wider ml-1">Status</label>
                                        <select
                                            className="w-full p-2.5 rounded-xl bg-white border border-gray-300 focus:border-red-500 transition-colors outline-none text-base font-bold text-gray-900 uppercase"
                                            value={entry.status_of_document}
                                            onChange={e => handleChange(entry.id, 'status_of_document', e.target.value)}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-900 uppercase tracking-wider ml-1">Validity Period</label>
                                        <input
                                            type="text"
                                            className="w-full p-2.5 rounded-xl bg-white border border-gray-300 focus:border-red-500 transition-colors outline-none text-base font-bold text-gray-900"
                                            value={entry.validity_period}
                                            onChange={e => handleChange(entry.id, 'validity_period', e.target.value)}
                                            placeholder="e.g. 1 Year"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-xs font-bold text-gray-900 uppercase tracking-wider ml-1 px-1 flex justify-between">
                                            <span>Upload Documents (Images/PDFs)</span>
                                            {entry.files.length > 0 && <span className="text-red-600 tracking-tighter">{entry.files.length} Files selected</span>}
                                        </label>
                                        <div className="space-y-3">
                                            <div className="relative group">
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*,.pdf"
                                                    className="hidden"
                                                    id={`file-${entry.id}`}
                                                    onChange={e => {
                                                        const newFiles = e.target.files ? Array.from(e.target.files) : [];
                                                        handleChange(entry.id, 'files', [...entry.files, ...newFiles]);
                                                    }}
                                                />
                                                <label 
                                                    htmlFor={`file-${entry.id}`}
                                                    className={`flex items-center justify-center gap-3 w-full p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer bg-white ${entry.files.length > 0 ? 'border-red-200 bg-red-50/10' : 'border-gray-200 hover:border-red-400 hover:bg-red-50/5'}`}
                                                >
                                                    <div className="flex items-center gap-2 text-gray-400 group-hover:text-red-600 transition-colors">
                                                        <Plus size={20} />
                                                        <span className="text-sm font-bold">{entry.files.length > 0 ? 'Add More Files' : 'Select PDF or Images'}</span>
                                                    </div>
                                                </label>
                                            </div>

                                            {entry.files.length > 0 && (
                                                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto no-scrollbar p-1">
                                                    {entry.files.map((file, fIdx) => (
                                                        <div key={fIdx} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm animate-in slide-in-from-left-2">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400">
                                                                    <FileText size={14} />
                                                                </div>
                                                                <span className="text-[11px] font-bold text-gray-700 truncate">{file.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => handleLocalPreview(entry.files, entry.document_name || entry.instrument_name)}
                                                                    className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all p-1.5 rounded-lg"
                                                                    title="Preview"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updatedFiles = entry.files.filter((_, i) => i !== fIdx);
                                                                        handleChange(entry.id, 'files', updatedFiles);
                                                                    }}
                                                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all p-1.5 rounded-lg"
                                                                    title="Remove"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-center pt-2">
                            <button
                                type="button"
                                onClick={addEntry}
                                className="flex items-center gap-2 px-8 py-3.5 rounded-xl border-2 border-red-100 bg-white text-red-600 text-xs font-black uppercase tracking-widest hover:border-red-600 hover:bg-red-50 shadow-sm transition-all"
                            >
                                <Plus size={18} />
                                Add Another Record
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
                        {isSubmitting ? 'Syncing...' : 'Save to Database'}
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
