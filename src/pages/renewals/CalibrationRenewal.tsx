import { useState } from 'react';
import useDataStore, { DocumentItem, RenewalItem } from '../../store/dataStore';
import { Search, ShieldCheck, X, Check, Calendar, Download, RotateCcw, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/dateFormatter';
import ConfirmModal from '../../components/ConfirmModal';

const CalibrationRenewal = () => {
    const { documents = [], updateDocument, addRenewalHistory } = useDataStore();

    const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'critical'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const [againRenewal, setAgainRenewal] = useState(true);
    const [nextRenewalDate, setNextRenewalDate] = useState('');
    const [newFileName, setNewFileName] = useState('');
    const [newFileContent, setNewFileContent] = useState<string>('');

    // Partition Documents into Overdue and Critical
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const criticalThreshold = new Date(today);
    criticalThreshold.setDate(today.getDate() + 30);

    const baseDocs = documents.filter(doc => doc.category === 'Calibration' && doc.needsRenewal && doc.renewalDate);

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
        setNewFileContent('');
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
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewFileContent(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleDownload = (fileContent: string | undefined, fileName: string | null) => {
        if (!fileContent && (!fileName || !fileName.startsWith('http'))) {
            setAlertMessage("Calibration certificate file is not available in the database.");
            setShowAlert(true);
            return;
        }
        if (fileName?.startsWith('http')) {
            window.open(fileName, '_blank');
        } else if (fileContent) {
            const link = document.createElement('a');
            link.href = fileContent;
            link.download = fileName || 'calibration_cert';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleSaveRenewal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDoc) return;

        if (againRenewal && !nextRenewalDate) {
            toast.error("Please select Next Renewal Date");
            return;
        }

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
            oldFileContent: selectedDoc.fileContent,
            renewalStatus: againRenewal ? 'Yes' : 'No',
            nextRenewalDate: againRenewal ? nextRenewalDate : null,
            newFile: newFileName || null,
            newFileContent: newFileContent || undefined
        };

        addRenewalHistory(historyItem);

        const updates: Partial<DocumentItem> = {};
        if (againRenewal) {
            updates.renewalDate = nextRenewalDate;
            if (newFileName) {
                updates.file = newFileName;
                updates.fileContent = newFileContent;
            }
        } else {
            updates.needsRenewal = false;
            updates.renewalDate = undefined;
        }

        updateDocument(selectedDoc.id, updates);
        toast.success("Calibration renewal processed successfully");
        handleCloseRenewal();
    };

    return (
        <div className="space-y-4 font-sans">
            {/* Header / Tabs Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative flex-1 w-full max-w-lg">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="SEARCH DATA INVENTORY..."
                        className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 bg-gray-50 text-xs font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-bold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                            activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <span>All</span>
                        <span className="ml-1 opacity-50">{searchedDocs.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('critical')}
                        className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                            activeTab === 'critical' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <span>Critical</span>
                        <span className="ml-1 opacity-50">{criticalDocuments.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('overdue')}
                        className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                            activeTab === 'overdue' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <span>Overdue</span>
                        <span className="ml-1 opacity-50">{overdueDocuments.length}</span>
                    </button>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-red-50 shadow-sm border-b border-gray-100 text-[10px] md:text-[11px] uppercase text-gray-950 font-black tracking-widest">
                                <th className="px-5 py-4 w-32 text-center rounded-tl-xl">Operations</th>
                                <th className="px-5 py-3">Reference No</th>
                                <th className="px-5 py-3">Certificate Name</th>
                                <th className="px-5 py-3">Equipment / Brand</th>
                                <th className="px-5 py-3 text-center">Due Date</th>
                                <th className="px-5 py-3 text-center">View</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {displayDocs.length > 0 ? displayDocs.map((doc) => {
                                const isOverdue = new Date(doc.renewalDate!) < today;
                                const isCritical = !isOverdue && new Date(doc.renewalDate!) <= criticalThreshold;

                                return (
                                    <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3 text-center">
                                            <button 
                                                onClick={() => handleOpenRenewal(doc)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded hover:bg-red-700 transition-all"
                                            >
                                                <RotateCcw size={14} />
                                                Renew
                                            </button>
                                        </td>
                                        <td className="px-5 py-3 text-xs font-medium text-gray-500">{doc.sn}</td>
                                        <td className="px-5 py-3 text-gray-900 font-bold">{doc.documentName}</td>
                                        <td className="px-5 py-3 text-gray-600 text-xs">{doc.companyName}</td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                isOverdue ? 'bg-red-50 text-red-700' : 
                                                isCritical ? 'bg-amber-50 text-amber-700' : 
                                                'bg-green-50 text-green-700'
                                            }`}>
                                                {doc.renewalDate ? formatDate(doc.renewalDate) : '-'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            {doc.file ? (
                                                <button onClick={() => handleDownload(doc.fileContent, doc.file)} className="text-red-600 hover:text-red-700 transition-colors">
                                                    <Download size={16} />
                                                </button>
                                            ) : <span className="text-gray-300">-</span>}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center text-gray-400">
                                        <ShieldCheck size={40} className="mx-auto mb-2 text-green-200" />
                                        <p className="font-medium">All calibrations are up to date</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {displayDocs.length > 0 ? displayDocs.map((doc) => {
                    const isOverdue = new Date(doc.renewalDate!) < today;
                    const isCritical = !isOverdue && new Date(doc.renewalDate!) <= criticalThreshold;

                    return (
                        <div key={doc.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900">{doc.companyName}</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">Ref: {doc.sn}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    isOverdue ? 'text-red-700 bg-red-50' : isCritical ? 'text-amber-700 bg-amber-50' : 'text-green-700 bg-green-50'
                                }`}>
                                    {isOverdue ? 'Overdue' : isCritical ? 'Critical' : 'Healthy'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-50">
                                <div>
                                    <p className="font-bold text-gray-800">{doc.documentName}</p>
                                    <p className="text-gray-500 mt-0.5">Due: {doc.renewalDate ? formatDate(doc.renewalDate) : '-'}</p>
                                </div>
                                <div className="flex gap-2">
                                     {doc.file && (
                                        <button onClick={() => handleDownload(doc.fileContent, doc.file)} className="p-1.5 text-red-600">
                                            <Download size={16} />
                                        </button>
                                    )}
                                    <button onClick={() => handleOpenRenewal(doc)} className="px-3 py-1.5 bg-red-600 text-white font-bold text-[10px] uppercase rounded">
                                        Renew
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-10 text-center text-gray-400">
                        <ShieldCheck size={40} className="mx-auto mb-2 text-green-100" />
                        <p className="text-xs">No calibration renewals required</p>
                    </div>
                )}
            </div>

            {/* Renewal Modal */}
            {isRenewalModalOpen && selectedDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Renew Calibration</h3>
                            <button onClick={handleCloseRenewal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSaveRenewal} className="p-6 space-y-4">
                             <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Equipment:</span>
                                    <span className="font-bold text-gray-900">{selectedDoc.documentName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Brand/Asset:</span>
                                    <span className="text-gray-700">{selectedDoc.companyName}</span>
                                </div>
                                <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                                    <span className="text-gray-500">Expiry Date:</span>
                                    <span className="font-bold text-red-600">{selectedDoc.renewalDate ? formatDate(selectedDoc.renewalDate) : 'URGENT'}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Schedule next?</span>
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
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Next Calibration Date</label>
                                            <input 
                                                type="date" 
                                                required
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-100"
                                                value={nextRenewalDate}
                                                onChange={e => setNextRenewalDate(e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-900 uppercase tracking-widest mb-1">New Certificate File</label>
                                            <div className="relative">
                                                <input type="file" id="renewal-file" className="hidden" onChange={handleFileChange} />
                                                <label htmlFor="renewal-file" className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 cursor-pointer hover:border-red-400 hover:text-red-500 transition-all font-medium text-xs">
                                                    <Upload size={16} />
                                                    {newFileName || "Upload Certificate"}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={handleCloseRenewal} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-all">
                                    Process
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
        </div>
    );
};

export default CalibrationRenewal;
