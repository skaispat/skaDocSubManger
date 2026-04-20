import React, { useState, useEffect } from 'react';
import useDataStore, { DocumentItem } from '../../store/dataStore';
import { toast } from 'react-hot-toast';
import { X, Save, FileText, Upload, FileUp, Trash2, Eye } from 'lucide-react';
import { documentService, DocumentType } from '../../api/documentService';
import { storageService } from '../../api/storageService';
import PreviewModal from '../../components/PreviewModal';

interface EditDocumentProps {
    isOpen: boolean;
    onClose: () => void;
    documentId: string | null;
}

const EditDocument: React.FC<EditDocumentProps> = ({ isOpen, onClose, documentId }) => {
    const { documents, updateDocument } = useDataStore();
    const [formData, setFormData] = useState<any>({});
    const [existingFiles, setExistingFiles] = useState<string[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [category, setCategory] = useState<'Company' | 'Calibration' | 'Project' | 'Compliance'>('Company');
    const [isSaving, setIsSaving] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState<{ files: string[], name: string }>({ files: [], name: '' });

    useEffect(() => {
        if (isOpen && documentId) {
            const doc = documents.find(d => d.id === documentId);
            if (doc) {
                const cat = (doc.category as any) || 'Company';
                setCategory(cat);

                const currentFiles = doc.file ? doc.file.split(',').filter(f => f.trim() !== '') : [];
                setExistingFiles(currentFiles);
                setNewFiles([]);

                setFormData({
                    document_name: doc.documentName,
                    renewable: doc.needsRenewal ? 'Yes' : 'No',
                    renewable_date: doc.renewalDate || '',
                    status_of_document: doc.status || 'Active',
                    document_view: doc.file || '',
                    instrument_name: doc.documentType,
                    brand_name: doc.brandName || doc.companyName || '',
                    calibration_date: doc.calibrationDate || doc.date || '',
                    validity_period: doc.validityPeriod || '',
                    document_type: doc.documentType || '',
                    id_sr_no: doc.serialNo || '',
                    certificate_number: doc.certificateNo || '',
                    location: doc.location || '',
                    whatsapp_no: doc.whatsappNo || ''
                });
            }
        }
    }, [isOpen, documentId, documents]);

    if (!isOpen || !documentId) return null;

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => {
            const updated = { ...prev, [field]: value };
            // Auto set status to Completed if Renewable is No
            if (field === 'renewable' && value === 'No') {
                updated.status_of_document = 'Completed';
            }
            return updated;
        });
    };

    const handleLocalPreview = (files: File[], documentName: string) => {
        if (files.length === 0) return;
        const blobUrls = files.map(file => {
            const url = URL.createObjectURL(file);
            return file.type === 'application/pdf' ? `${url}#pdf` : url;
        });
        setPreviewData({ files: blobUrls, name: documentName || 'New Document' });
        setIsPreviewOpen(true);
    };

    const handleExistingPreview = (url: string, documentName: string) => {
        setPreviewData({ files: [url], name: documentName });
        setIsPreviewOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const table: DocumentType = category === 'Calibration' ? 'calibration_certificate' :
            category === 'Project' ? 'project_approval' : 
            category === 'Compliance' ? 'compliance_documents' : 'company_documents';

        try {
            // Construct category-specific payload to avoid sending extra fields
            let finalPayload: any = {
                document_view: '', // will be set below
                renewable: formData.renewable,
                renewable_date: formData.renewable_date || null,
                status_of_document: formData.status_of_document,
                validity_period: formData.validity_period,
                whatsapp_no: formData.whatsapp_no
            };

            if (category === 'Calibration') {
                finalPayload.instrument_name = formData.instrument_name;
                finalPayload.brand_name = formData.brand_name;
                finalPayload.calibration_date = formData.calibration_date || null;
                finalPayload.certificate_number = formData.certificate_number;
                finalPayload.id_sr_no = formData.id_sr_no;
                finalPayload.location = formData.location;
            } else {
                finalPayload.document_name = formData.document_name;
                if (category === 'Compliance') {
                    finalPayload.document_type = formData.document_type;
                }
            }

            // Handle new file uploads
            let newUrls: string[] = [];
            if (newFiles.length > 0) {
                const uploadToast = toast.loading(`Uploading ${newFiles.length} new documents...`);
                const uploadPromises = newFiles.map(f => storageService.uploadFile(f));
                const results = await Promise.all(uploadPromises);
                toast.dismiss(uploadToast);
                newUrls = results.filter(url => url !== null) as string[];
            }

            // Combine existing and new
            const allUrls = [...existingFiles, ...newUrls];
            finalPayload.document_view = allUrls.join(',');

            const success = await documentService.update(table, documentId, finalPayload);
            if (success) {
                updateDocument(documentId, {
                    documentName: finalPayload.document_name || finalPayload.instrument_name,
                    documentType: finalPayload.document_type || finalPayload.instrument_name,
                    companyName: finalPayload.brand_name || finalPayload.document_name,
                    needsRenewal: finalPayload.renewable === 'Yes',
                    renewalDate: finalPayload.renewable_date,
                    status: finalPayload.status_of_document,
                    file: finalPayload.document_view,
                    brandName: finalPayload.brand_name,
                    serialNo: finalPayload.id_sr_no,
                    certificateNo: finalPayload.certificate_number,
                    location: finalPayload.location,
                    calibrationDate: finalPayload.calibration_date,
                    validityPeriod: finalPayload.validity_period,
                    whatsappNo: finalPayload.whatsapp_no
                });
                toast.success("Record updated successfully");
                onClose();
            } else {
                toast.error("Failed to update database");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto font-sans">
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                            <FileText className="text-red-600" size={28} />
                            Update Record
                        </h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">ID: {documentId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                    <form id="edit-supabase-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Document Name / Instrument</label>
                            <input
                                type="text"
                                className="w-full p-3 rounded-xl bg-white border border-gray-300 outline-none focus:border-red-500 transition-all text-sm font-bold text-gray-900"
                                value={formData.document_name || formData.instrument_name || ''}
                                onChange={e => handleChange(category === 'Calibration' ? 'instrument_name' : 'document_name', e.target.value)}
                            />
                        </div>

                        {category === 'Calibration' && (
                            <>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Brand Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 rounded-xl bg-white border border-gray-300 outline-none focus:border-red-500 transition-all text-sm font-bold text-gray-900"
                                        value={formData.brand_name || ''}
                                        onChange={e => handleChange('brand_name', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Calibration Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-3 rounded-xl bg-white border border-gray-300 outline-none focus:border-red-500 transition-all text-sm font-bold text-gray-900"
                                        value={formData.calibration_date || ''}
                                        onChange={e => handleChange('calibration_date', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Certificate Number</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 rounded-xl bg-white border border-gray-300 outline-none focus:border-red-500 transition-all text-sm font-bold text-gray-900"
                                        value={formData.certificate_number || ''}
                                        onChange={e => handleChange('certificate_number', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Serial Number</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 rounded-xl bg-white border border-gray-300 outline-none focus:border-red-500 transition-all text-sm font-bold text-gray-900"
                                        value={formData.id_sr_no || ''}
                                        onChange={e => handleChange('id_sr_no', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Location</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 rounded-xl bg-white border border-gray-300 outline-none focus:border-red-500 transition-all text-sm font-bold text-gray-900"
                                        value={formData.location || ''}
                                        onChange={e => handleChange('location', e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Validity Period</label>
                            <input
                                type="text"
                                className="w-full p-3 rounded-xl bg-white border border-gray-300 outline-none focus:border-red-500 transition-all text-sm font-bold text-gray-900"
                                value={formData.validity_period || ''}
                                onChange={e => handleChange('validity_period', e.target.value)}
                                placeholder="e.g. 1 Year, 6 Months"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">WhatsApp No (For Alerts)</label>
                            <input
                                type="tel"
                                className="w-full p-3 rounded-xl bg-white border border-gray-300 outline-none focus:border-red-500 transition-all text-sm font-bold text-gray-900"
                                value={formData.whatsapp_no || ''}
                                onChange={e => handleChange('whatsapp_no', e.target.value)}
                                placeholder="e.g. 919876543210"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Renewable</label>
                            <select
                                className="w-full p-3 rounded-xl bg-white border border-gray-300 outline-none focus:border-red-500 transition-all text-sm font-bold text-gray-900 uppercase"
                                value={formData.renewable}
                                onChange={e => handleChange('renewable', e.target.value)}
                            >
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>

                        {formData.renewable === 'Yes' && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Next Deadline</label>
                                <input
                                    type="date"
                                    className="w-full p-3 rounded-xl bg-white border border-gray-300 outline-none focus:border-red-500 transition-all text-sm font-bold text-gray-900"
                                    value={formData.renewable_date || ''}
                                    onChange={e => handleChange('renewable_date', e.target.value)}
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Status</label>
                            <select
                                className="w-full p-3 rounded-xl bg-white border border-gray-300 outline-none focus:border-red-500 transition-all text-sm font-bold text-gray-900 uppercase"
                                value={formData.status_of_document || ''}
                                onChange={e => handleChange('status_of_document', e.target.value)}
                            >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>

                        <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-100">
                            <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Document Management</label>
                            
                            {/* Existing Files */}
                            {existingFiles.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Currently Attached ({existingFiles.length})</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {existingFiles.map((url, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 group">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <FileText size={16} className="text-red-500 flex-shrink-0" />
                                                    <span className="text-xs font-bold text-gray-700 truncate capitalize">
                                                        {url.split('/').pop()?.split('-').slice(1).join('-') || `File ${idx + 1}`}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleExistingPreview(url, formData.document_name || formData.instrument_name)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                        title="Preview"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setExistingFiles(prev => prev.filter((_, i) => i !== idx))}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Remove"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Uploads */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Add New Documents</p>
                                <div className="space-y-3">
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*,.pdf"
                                            className="hidden"
                                            id="edit-file-input"
                                            onChange={e => {
                                                const files = e.target.files ? Array.from(e.target.files) : [];
                                                setNewFiles(prev => [...prev, ...files]);
                                            }}
                                        />
                                        <label
                                            htmlFor="edit-file-input"
                                            className={`flex items-center justify-center gap-3 w-full p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer bg-white ${newFiles.length > 0 ? 'border-blue-200 bg-blue-50/10' : 'border-gray-200 hover:border-red-400'}`}
                                        >
                                            <div className="flex items-center gap-2 text-gray-400 group-hover:text-red-600 transition-colors">
                                                <Upload size={20} />
                                                <span className="text-sm font-bold">{newFiles.length > 0 ? 'Add More Files' : 'Select PDF or Images'}</span>
                                            </div>
                                        </label>
                                    </div>

                                    {newFiles.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {newFiles.map((file, fIdx) => (
                                                <div key={fIdx} className="flex items-center justify-between p-3 bg-blue-50/30 rounded-xl border border-blue-100 animate-in slide-in-from-left-2">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <FileUp size={16} className="text-blue-500 flex-shrink-0" />
                                                        <span className="text-xs font-bold text-blue-900 truncate">{file.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleLocalPreview(newFiles, formData.document_name || formData.instrument_name)}
                                                            className="text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all p-1.5 rounded-lg"
                                                            title="Preview"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => setNewFiles(prev => prev.filter((_, i) => i !== fIdx))}
                                                            className="text-blue-400 hover:text-red-600 hover:bg-red-50 transition-all p-1.5 rounded-lg"
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
                    </form>
                </div>

                {/* Footer */}
                <div className="flex gap-4 px-8 py-6 border-t border-gray-100 bg-gray-50">
                    <button type="button" onClick={onClose} className="flex-1 py-3 px-6 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-gray-900 transition-colors">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="edit-supabase-form"
                        disabled={isSaving}
                        className={`flex-[2] flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-black transition-all ${isSaving ? 'opacity-50' : ''}`}
                    >
                        {isSaving ? 'Syncing...' : 'Update Record'}
                    </button>
                </div>
            </div>

            <PreviewModal 
                isOpen={isPreviewOpen}
                onClose={() => {
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

export default EditDocument;
