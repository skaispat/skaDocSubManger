import { useState, useEffect } from 'react';
import useDataStore, { DocumentItem, RenewalItem } from '../../store/dataStore';
import { Search, FileText, X, Check, Clock, AlertTriangle, Calendar, Download, RotateCcw, RefreshCw, Upload, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/dateFormatter';
import ConfirmModal from '../../components/ConfirmModal';
import PreviewModal from '../../components/PreviewModal';
import { documentService, DocumentType } from '../../api/documentService';

const DocumentRenewal = () => {
    const { documents = [], setDocuments, updateDocument, addRenewalHistory } = useDataStore();

    const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'critical'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Modal State
    const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

    // Alert Modal State
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState<{ files: string[], name: string }>({ files: [], name: '' });

    // Form State
    const [againRenewal, setAgainRenewal] = useState(true);
    const [nextRenewalDate, setNextRenewalDate] = useState('');
    const [newFileName, setNewFileName] = useState('');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const tables: DocumentType[] = ['company_documents', 'calibration_certificate', 'project_approval', 'compliance_documents'];
            let allDocs: DocumentItem[] = [];

            for (const table of tables) {
                const data = await documentService.getAll(table);
                const mapped = data.map(item => ({
                    id: item.id_no,
                    sn: item.id_no,
                    companyName: item.brand_name || item.document_name || 'N/A',
                    documentType: item.instrument_name || item.document_type || 'N/A',
                    category: table === 'company_documents' ? 'Company' :
                        table === 'calibration_certificate' ? 'Calibration' :
                            table === 'compliance_documents' ? 'Compliance' : 'Project',
                    documentName: item.document_name || item.certificate_number || 'N/A',
                    needsRenewal: item.renewable === 'Yes',
                    renewalDate: item.renewable_date,
                    file: item.document_view || null,
                    date: item.calibration_date || item.created_at?.split('T')[0] || '',
                    status: item.status_of_document || 'Active'
                }));
                allDocs = [...allDocs, ...mapped];
            }
            setDocuments(allDocs);
        } catch (error) {
            toast.error("Failed to sync records");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const criticalThreshold = new Date(today);
    criticalThreshold.setDate(today.getDate() + 30);

    const baseDocs = documents.filter(doc => doc.needsRenewal && doc.renewalDate);

    const searchedDocs = baseDocs.filter(doc =>
        (doc.documentName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (doc.companyName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (doc.sn?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const overdueDocuments = searchedDocs.filter(doc => new Date(doc.renewalDate!) < today);
    const criticalDocuments = searchedDocs.filter(doc => {
        const d = new Date(doc.renewalDate!);
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

    const handleOpenRenewal = (doc: DocumentItem) => {
        setSelectedDoc(doc);
        setAgainRenewal(true);
        setNextRenewalDate('');
        setNewFileName('');
        setIsRenewalModalOpen(true);
    };

    const handleCloseRenewal = () => {
        setIsRenewalModalOpen(false);
        setSelectedDoc(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewFileName(file.name);
        }
    };

    const handlePreview = (fileLink: string | null, documentName: string) => {
        if (!fileLink) {
            setAlertMessage("No documents available to view.");
            setShowAlert(true);
            return;
        }

        const files = fileLink.split(',').filter(f => f.trim() !== '');
        if (files.length === 0) {
            setAlertMessage("No valid document links found.");
            setShowAlert(true);
            return;
        }

        setPreviewData({ files, name: documentName });
        setIsPreviewOpen(true);
    };

    const handleSaveRenewal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDoc) return;

        if (againRenewal && !nextRenewalDate) {
            toast.error("Please select Next Renewal Date");
            return;
        }

        setIsLoading(true);

        const table: DocumentType = selectedDoc.category === 'Company' ? 'company_documents' :
            selectedDoc.category === 'Calibration' ? 'calibration_certificate' :
                selectedDoc.category === 'Compliance' ? 'compliance_documents' : 'project_approval';

        const payload: any = {
            renewable: againRenewal ? 'Yes' : 'No',
            renewable_date: againRenewal ? nextRenewalDate : null,
            document_view: newFileName || selectedDoc.file
        };

        try {
            const success = await documentService.update(table, selectedDoc.id, payload);
            if (success) {
                const historyItem: RenewalItem = {
                    id: Math.random().toString(36).substr(2, 9),
                    documentId: selectedDoc.id,
                    sn: selectedDoc.sn,
                    documentName: selectedDoc.documentName,
                    documentType: selectedDoc.documentType,
                    category: selectedDoc.category,
                    companyName: selectedDoc.companyName,
                    entryDate: selectedDoc.date,
                    oldRenewalDate: selectedDoc.renewalDate || '-',
                    oldFile: selectedDoc.file,
                    renewalStatus: againRenewal ? 'Yes' : 'No',
                    nextRenewalDate: againRenewal ? nextRenewalDate : null,
                    newFile: newFileName || selectedDoc.file || null,
                };
                addRenewalHistory(historyItem);

                const updates: Partial<DocumentItem> = {
                    renewalDate: againRenewal ? nextRenewalDate : undefined,
                    needsRenewal: againRenewal,
                    file: payload.document_view
                };
                updateDocument(selectedDoc.id, updates);

                toast.success("Database record updated");
                handleCloseRenewal();
            } else {
                toast.error("Failed to update database");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4 font-sans">
            {/* Header Section */}
            <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="min-h-[32px] flex items-center">
                        <h2 className="text-sm sm:text-base font-bold text-gray-500 uppercase tracking-widest">Document Renewals</h2>
                    </div>

                    <div className="flex bg-gray-50 p-1.5 rounded-lg border border-gray-200 w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex-1 sm:flex-none px-6 py-2 text-xs font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'all' ? 'bg-white text-gray-950 shadow-md' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            All <span className="ml-1 opacity-40">{searchedDocs.length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('critical')}
                            className={`flex-1 sm:flex-none px-6 py-2 text-xs font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'critical' ? 'bg-white text-amber-700 shadow-md' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            Critical <span className="ml-1 opacity-40">{criticalDocuments.length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('overdue')}
                            className={`flex-1 sm:flex-none px-6 py-2 text-xs font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'overdue' ? 'bg-white text-red-700 shadow-md' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            Overdue <span className="ml-1 opacity-40">{overdueDocuments.length}</span>
                        </button>
                    </div>
                </div>

                <div className="relative w-full flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="SEARCH ACROSS DOCUMENT RENEWALS..."
                            className="pl-12 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-50 bg-gray-50 text-sm font-bold text-gray-900 placeholder:text-gray-400 transition-all uppercase tracking-wide"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={isLoading}
                        className={`p-3 bg-white border border-gray-200 text-gray-600 hover:text-red-600 rounded-xl transition-all shadow-sm ${isLoading ? 'animate-spin' : ''}`}
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-red-50 shadow-sm border-b border-gray-100 text-[10px] md:text-[11px] uppercase text-gray-950 font-black tracking-widest">
                                <th className="px-5 py-4 w-32 text-center rounded-tl-xl">Action</th>
                                <th className="px-5 py-3">Document Name</th>
                                <th className="px-5 py-3 text-center">Category</th>
                                <th className="px-5 py-3 text-center rounded-tr-xl">Renewal Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center">
                                        <div className="inline-block h-8 w-8 border-4 border-red-100 border-t-red-600 rounded-full animate-spin" />
                                    </td>
                                </tr>
                            ) : displayDocs.length > 0 ? displayDocs.map((doc) => {
                                const isOverdue = new Date(doc.renewalDate!) < today;
                                const isCritical = !isOverdue && new Date(doc.renewalDate!) <= criticalThreshold;

                                return (
                                    <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenRenewal(doc)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded hover:bg-red-700 transition-all shadow-sm"
                                                >
                                                    <RotateCcw size={12} />
                                                    Renew
                                                </button>
                                                {doc.file && (
                                                    <button onClick={() => handlePreview(doc.file, doc.documentName)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-100 bg-white" title="View Document">
                                                        <Eye size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-gray-900 font-bold">{doc.documentName}</td>
                                        <td className="px-5 py-3 text-center">
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase">
                                                {doc.category}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${isOverdue ? 'bg-red-50 text-red-700' :
                                                isCritical ? 'bg-amber-50 text-amber-700' :
                                                    'bg-green-50 text-green-700'
                                                }`}>
                                                {doc.renewalDate ? formatDate(doc.renewalDate) : '-'}
                                            </span>
                                        </td>

                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center text-gray-400">
                                        <Check size={40} className="mx-auto mb-2 text-green-200" />
                                        <p className="font-medium">No documents require renewal in this category</p>
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
                    <div className="py-10 text-center">
                        <div className="inline-block h-8 w-8 border-4 border-red-100 border-t-red-600 rounded-full animate-spin" />
                    </div>
                ) : displayDocs.length > 0 ? displayDocs.map((doc) => {
                    const isOverdue = new Date(doc.renewalDate!) < today;
                    const isCritical = !isOverdue && new Date(doc.renewalDate!) <= criticalThreshold;

                    return (
                        <div key={doc.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900">{doc.documentName}</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{doc.documentType} • {doc.category}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isOverdue ? 'text-red-700 bg-red-50' : isCritical ? 'text-amber-700 bg-amber-50' : 'text-green-700 bg-green-50'
                                    }`}>
                                    {isOverdue ? 'Overdue' : isCritical ? 'Critical' : 'Healthy'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-50">
                                <span className="text-gray-500">Renewal: {doc.renewalDate ? formatDate(doc.renewalDate) : '-'}</span>
                                <div className="flex gap-2">
                                    {doc.file && (
                                        <button onClick={() => handlePreview(doc.file, doc.documentName)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                            <Eye size={18} />
                                        </button>
                                    )}
                                    <button onClick={() => handleOpenRenewal(doc)} className="p-1.5 text-red-600 font-bold text-[10px] uppercase border border-red-100 rounded hover:bg-red-50 transition-colors">
                                        Renew
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-10 text-center text-gray-400">
                        <Check size={40} className="mx-auto mb-2 text-green-100" />
                        <p className="text-xs">All clear</p>
                    </div>
                )}
            </div>

            {/* Renewal Modal */}
            {isRenewalModalOpen && selectedDoc && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Renew Document</h3>
                            <button onClick={handleCloseRenewal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveRenewal} className="p-6 space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Document:</span>
                                    <span className="font-bold text-gray-900">{selectedDoc.documentName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Current Expiry:</span>
                                    <span className="font-bold text-red-600">{selectedDoc.renewalDate ? formatDate(selectedDoc.renewalDate) : 'N/A'}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Continue renewals?</span>
                                    <button
                                        type="button"
                                        onClick={() => setAgainRenewal(!againRenewal)}
                                        className={`w-10 h-5 flex items-center p-1 rounded-full transition-colors ${againRenewal ? 'bg-red-600' : 'bg-gray-300'}`}
                                    >
                                        <div className={`w-3 h-3 bg-white rounded-full transform transition-transform ${againRenewal ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {againRenewal && (
                                    <div className="space-y-4 animate-fade-in">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Next Renewal Date</label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-100 outline-none"
                                                value={nextRenewalDate}
                                                onChange={e => setNextRenewalDate(e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">New Document File</label>
                                            <div className="relative">
                                                <input type="file" id="renewal-file" className="hidden" onChange={handleFileChange} />
                                                <label
                                                    htmlFor="renewal-file"
                                                    className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 cursor-pointer hover:border-red-400 hover:text-red-500 transition-all font-medium text-xs"
                                                >
                                                    <Upload size={16} />
                                                    {newFileName || "Choose File"}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseRenewal}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? 'Saving...' : 'Update Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={showAlert}
                onClose={() => setShowAlert(false)}
                title="System Alert"
                message={alertMessage}
                confirmText="Close"
                type="alert"
            />
            <PreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                files={previewData.files}
                documentName={previewData.name}
            />
        </div>
    );
};

export default DocumentRenewal;
