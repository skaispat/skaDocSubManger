import { useState, useEffect } from 'react';
import useDataStore, { DocumentItem, RenewalItem } from '../../store/dataStore';
import { Search, X, Check, Calendar, RotateCcw, Upload, Eye, FileText, History, CheckCircle, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/dateFormatter';
import ConfirmModal from '../../components/ConfirmModal';
import PreviewModal from '../../components/PreviewModal';
import RenewalHistoryModal from '../../components/RenewalHistoryModal';
import { documentService } from '../../api/documentService';
import { storageService } from '../../api/storageService';

const CompanyRenewal = ({ navigator }: { navigator?: React.ReactNode }) => {
    const { updateDocument, addRenewalHistory } = useDataStore();

    const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'critical'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [companyDocs, setCompanyDocs] = useState<any[]>([]);

    // Modal State
    const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    // Form State
    const [againRenewal, setAgainRenewal] = useState(true);
    const [nextRenewalDate, setNextRenewalDate] = useState('');
    const [validityPeriod, setValidityPeriod] = useState('');
    const [pendingFiles, setPendingFiles] = useState<{ name: string, content: string }[]>([]);

    // Preview Modal State
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState<{ files: string[], name: string }>({ files: [], name: '' });

    // History Modal State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyData, setHistoryData] = useState<any[]>([]);

    const handlePreview = (fileLink: string | null, documentName: string) => {
        if (!fileLink) {
            toast.error("No documents available to view.");
            return;
        }

        const files = fileLink.split(',').filter(f => f.trim() !== '');
        if (files.length === 0) {
            toast.error("No valid document links found.");
            return;
        }

        setPreviewData({ files, name: documentName });
        setIsPreviewOpen(true);
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await documentService.getAll('company_documents');
            const filtered = data.filter(item =>
                item.renewable?.toString().toLowerCase() === 'yes'
            );
            setCompanyDocs(filtered);
        } catch (error) {
            toast.error("Failed to sync company documents");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Partition Documents into Overdue and Critical
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const criticalThreshold = new Date(today);
    criticalThreshold.setDate(today.getDate() + 30);

    const baseDocs = companyDocs;

    const searchedDocs = baseDocs.filter(doc =>
        (doc.document_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (doc.document_type?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (doc.id_no?.toString().toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const overdueDocuments = searchedDocs.filter(doc => doc.renewable_date && new Date(doc.renewable_date) < today);
    const criticalDocuments = searchedDocs.filter(doc => {
        if (!doc.renewable_date) return false;
        const d = new Date(doc.renewable_date);
        return d >= today && d <= criticalThreshold;
    });

    const getDisplayDocs = () => {
        switch (activeTab) {
            case 'overdue': return overdueDocuments;
            case 'critical': return criticalDocuments;
            default: return searchedDocs;
        }
    };

    const displayDocs = getDisplayDocs();

    const handleOpenRenewal = (doc: any) => {
        setSelectedDoc(doc);
        setAgainRenewal(true);
        setNextRenewalDate('');
        setValidityPeriod(doc.validity_period || '');
        setPendingFiles([]);
        setIsRenewalModalOpen(true);
    };

    const handleCloseRenewal = () => {
        setIsRenewalModalOpen(false);
        setSelectedDoc(null);
        setNextRenewalDate('');
        setValidityPeriod('');
        setPendingFiles([]);
    };

    const handleViewHistory = async (doc: any) => {
        setSelectedDoc(doc);
        setIsLoading(true);
        try {
            const history = await documentService.getRenewalHistory('renew_company_doc', doc.id_no);
            setHistoryData(history);
            setIsHistoryOpen(true);
        } catch (error) {
            toast.error("Failed to fetch renewal history");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPendingFiles(prev => [...prev, {
                    name: file.name,
                    content: reader.result as string
                }]);
            };
            reader.readAsDataURL(file);
        }
    };

    const removePendingFile = (index: number) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDownload = (fileUrl: string | undefined, fileName: string | null) => {
        if (!fileUrl) {
            setAlertMessage("Document link is not available.");
            setShowAlert(true);
            return;
        }
        window.open(fileUrl, '_blank');
    };

    const handleSaveRenewal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDoc) return;

        if (againRenewal && !nextRenewalDate) {
            toast.error("Please select Next Renewal Date");
            return;
        }

        setIsLoading(true);
        try {
            let finalDocView = selectedDoc.document_view || '';
            const uploadedUrls: string[] = [];

            // 1. Upload all pending files
            for (const pFile of pendingFiles) {
                const response = await fetch(pFile.content);
                const blob = await response.blob();
                const file = new File([blob], pFile.name, { type: blob.type });

                const uploadedUrl = await storageService.uploadFile(file);
                if (uploadedUrl) {
                    uploadedUrls.push(uploadedUrl);
                }
            }

            // Append new URLs to existing ones
            if (uploadedUrls.length > 0) {
                const newPaths = uploadedUrls.join(',');
                finalDocView = finalDocView ? `${finalDocView},${newPaths}` : newPaths;
            }

            // 1. Log to history table: renew_company_doc
            const renewalData = {
                doc_id: selectedDoc.id_no,
                document_name: selectedDoc.document_name,
                document_view: finalDocView,
                last_renewable_date: selectedDoc.renewable_date,
                renewable_date: againRenewal ? nextRenewalDate : null,
                validity_period: validityPeriod
            };

            await documentService.logRenewal('renew_company_doc', renewalData);

            // 2. Update primary record
            const updates: any = {
                status_of_document: 'Active',
                document_view: finalDocView,
                renewable: againRenewal ? 'Yes' : 'No',
                renewable_date: againRenewal ? nextRenewalDate : null,
                validity_period: validityPeriod
            };

            const success = await documentService.update('company_documents', selectedDoc.id_no, updates);

            if (success) {
                toast.success("Renewal processed and history logged");
                fetchData();
                handleCloseRenewal();
            } else {
                toast.error("Failed to update database");
            }
        } catch (err) {
            console.error("Renewal Error:", err);
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4 font-sans">
            {/* Header Section */}
            <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
                    <div className="flex flex-row justify-between items-center w-full md:w-auto gap-4">
                        <h2 className="text-md font-black text-gray-900 uppercase tracking-tight">Company Renewals</h2>
                        {navigator}
                    </div>

                    <div className="flex bg-gray-50 p-1.5 rounded-lg border border-gray-200 w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'all' ? 'bg-white text-gray-950 shadow-md' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            All ({companyDocs.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('critical')}
                            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'critical' ? 'bg-white text-amber-700 shadow-md' : 'text-amber-600/70 hover:text-amber-700'
                                }`}
                        >
                            Critical ({criticalDocuments.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('overdue')}
                            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'overdue' ? 'bg-white text-red-700 shadow-md' : 'text-red-600/70 hover:text-red-700'
                                }`}
                        >
                            Overdue ({overdueDocuments.length})
                        </button>
                    </div>
                </div>

                <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="SEARCH ACROSS COMPANY RENEWALS..."
                        className="pl-12 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-50 bg-gray-50 text-sm font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-bold transition-all uppercase tracking-wide"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-red-50 shadow-sm border-b border-gray-100 text-[10px] md:text-[11px] uppercase text-gray-950 font-black tracking-widest">
                                <th className="px-5 py-4 w-32 text-center rounded-tl-xl">Actions</th>
                                <th className="px-5 py-3">Document Name</th>
                                <th className="px-5 py-3 text-center">Renewal Date</th>
                                <th className="px-5 py-3 text-center">Downloads</th>
                                <th className="px-5 py-3 text-center rounded-tr-xl">Renewal History</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr key="loading-desktop"><td colSpan={6} className="p-20 text-center text-gray-400">Syncing data...</td></tr>
                            ) : displayDocs.length > 0 ? displayDocs.map((doc, index) => {
                                const isOverdue = doc.renewable_date && new Date(doc.renewable_date) < today;
                                const isCritical = !isOverdue && doc.renewable_date && new Date(doc.renewable_date) <= criticalThreshold;

                                return (
                                    <tr key={doc.id_no || `doc-${index}`} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleOpenRenewal(doc)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all shadow-sm">
                                                    <RotateCcw size={12} /> Renew
                                                </button>
                                                <button onClick={() => handlePreview(doc.document_view, doc.document_name)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100 bg-white" title="View Document">
                                                    <Eye size={14} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-gray-900 font-bold">{doc.document_name}</td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isOverdue ? 'bg-red-50 text-red-700' : isCritical ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                                                {doc.renewable_date ? formatDate(doc.renewable_date) : '-'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <button onClick={() => handleDownload(doc.document_view, doc.document_name)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shadow-sm bg-white" title="Download">
                                                <Download size={14} />
                                            </button>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <button onClick={() => handleViewHistory(doc)} className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all">
                                                <History size={14} /> View History
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr key="empty-desktop">
                                    <td colSpan={6} className="p-20 text-center text-gray-400">
                                        <Check size={40} className="mx-auto mb-2 text-green-200" />
                                        <p className="font-medium">No renewals found in this category</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {isLoading ? (
                    <div key="loading-mobile" className="py-20 text-center text-gray-400">Syncing data...</div>
                ) : displayDocs.length > 0 ? displayDocs.map((doc, index) => {
                    const isOverdue = doc.renewable_date && new Date(doc.renewable_date) < today;
                    const isCritical = !isOverdue && doc.renewable_date && new Date(doc.renewable_date) <= criticalThreshold;

                    return (
                        <div key={doc.id_no || `doc-mobile-${index}`} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900">{doc.document_name}</h3>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isOverdue ? 'text-red-700 bg-red-50' : isCritical ? 'text-amber-700 bg-amber-50' : 'text-green-700 bg-green-50'}`}>
                                    {isOverdue ? 'Overdue' : isCritical ? 'Critical' : 'Healthy'}
                                </span>
                            </div>
                            <div className="space-y-3 pt-3 border-t border-gray-50 font-sans">
                                <div className="flex justify-between items-center text-xs">
                                    <div>
                                        <p className="font-black text-gray-400 uppercase tracking-tighter text-[9px]">Renewal Date</p>
                                        <p className="font-bold text-red-600 mt-0.5">{doc.renewable_date ? formatDate(doc.renewable_date) : '-'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handlePreview(doc.document_view, doc.document_name)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                                            <Eye size={12} /> View
                                        </button>
                                        <button onClick={() => handleOpenRenewal(doc)} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
                                            <RotateCcw size={12} /> Renew
                                        </button>
                                    </div>
                                </div>
                                <button onClick={() => handleViewHistory(doc)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-amber-100 shadow-sm transition-all hover:bg-amber-100 active:scale-[0.98]">
                                    <History size={14} /> View Renewal History
                                </button>
                            </div>
                        </div>
                    );
                }) : (
                    <div key="empty-mobile" className="py-10 text-center text-gray-400">
                        <Check size={40} className="mx-auto mb-2 text-green-100" />
                        <p className="text-xs">No pending renewals</p>
                    </div>
                )}
            </div>

            {/* Renewal Modal */}
            {isRenewalModalOpen && selectedDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Renew Document</h3>
                            <button onClick={handleCloseRenewal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveRenewal} className="p-6 space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-[11px] space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-700 font-bold uppercase tracking-wider">Document:</span>
                                    <span className="font-black text-gray-900">{selectedDoc.document_name}</span>
                                </div>
                                <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                                    <span className="text-gray-700 font-bold uppercase tracking-wider">Current Expiry:</span>
                                    <span className="font-black text-red-600">{selectedDoc.renewable_date ? formatDate(selectedDoc.renewable_date) : 'N/A'}</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Schedule next?</span>
                                    <button type="button" onClick={() => setAgainRenewal(!againRenewal)} className={`w-10 h-5 flex items-center p-1 rounded-full transition-colors ${againRenewal ? 'bg-red-600' : 'bg-gray-300'}`}>
                                        <div className={`w-3 h-3 bg-white rounded-full transform transition-transform ${againRenewal ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                {againRenewal && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider mb-1">Next Renewal Date</label>
                                            <input type="date" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-100 font-bold text-gray-900" value={nextRenewalDate} onChange={e => setNextRenewalDate(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider mb-1">Validity Period</label>
                                            <input type="text" placeholder="e.g. 1 Year, 6 Months" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-100 font-bold text-gray-900" value={validityPeriod} onChange={e => setValidityPeriod(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black text-gray-950 uppercase tracking-widest mb-1">Upload Documents</label>
                                            <div className="space-y-2">
                                                <div className="relative">
                                                    <input type="file" id="renewal-file" className="hidden" onChange={handleFileChange} />
                                                    <label htmlFor="renewal-file" className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 cursor-pointer hover:border-red-400 hover:text-red-500 transition-all font-medium text-xs">
                                                        <Upload size={16} /> Add Another Document
                                                    </label>
                                                </div>

                                                {pendingFiles.length > 0 && (
                                                    <div className="space-y-1.5 max-h-32 overflow-y-auto p-1">
                                                        {pendingFiles.map((file, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded-lg shadow-sm">
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <FileText size={14} className="text-red-500 shrink-0" />
                                                                    <span className="text-[10px] font-bold text-gray-700 truncate">{file.name}</span>
                                                                </div>
                                                                <button type="button" onClick={() => removePendingFile(idx)} className="text-gray-400 hover:text-red-500">
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={handleCloseRenewal} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-all">{isLoading ? 'Saving...' : 'Confirm'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal isOpen={showAlert} onClose={() => setShowAlert(false)} title="Alert" message={alertMessage} confirmText="Close" type="alert" />
            <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} files={previewData.files} documentName={previewData.name} />
            <RenewalHistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                history={historyData}
                documentName={selectedDoc?.document_name || ''}
                type="document"
            />
        </div>
    );
};

export default CompanyRenewal;
