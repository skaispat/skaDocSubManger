import { useState, useEffect } from 'react';
import { Plus, Search, ShieldCheck, Eye, Edit, Trash2, MoreHorizontal, Mail, MessageCircle, Share2, RefreshCw } from 'lucide-react';
import useDataStore, { DocumentItem } from '../../store/dataStore';
import AddDocument from './AddDocument';
import EditDocument from './EditDocument';
import ShareModal from './ShareModal';
import PreviewModal from '../../components/PreviewModal';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { formatDate } from '../../utils/dateFormatter';
import ConfirmModal from '../../components/ConfirmModal';
import { documentService } from '../../api/documentService';
import { toast } from 'react-hot-toast';

const ComplianceDocuments = ({ navigator }: { navigator?: React.ReactNode }) => {
    const { documents = [], setDocuments, deleteDocument } = useDataStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await documentService.getAll('compliance_documents');
            const mappedData: DocumentItem[] = data.map(item => ({
                id: item.id_no,
                sn: item.id_no,
                companyName: item.document_name, // Mapping document_name to companyName for dataStore consistency
                documentType: item.document_type || 'Compliance',
                category: 'Compliance',
                documentName: item.document_name,
                needsRenewal: item.renewable === 'Yes',
                renewalDate: item.renewable_date,
                file: item.document_view || null,
                date: item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                status: item.status_of_document || 'Active',
                validityPeriod: item.validity_period || 'N/A'
            }));
            setDocuments(mappedData);
        } catch (error) {
            toast.error("Failed to fetch compliance documents");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = documents.filter(item => {
        const matchesSearch =
            (String(item.documentName || '').toLowerCase()).includes(searchTerm.toLowerCase()) ||
            (String(item.companyName || '').toLowerCase()).includes(searchTerm.toLowerCase()) ||
            (String(item.sn || '').toLowerCase()).includes(searchTerm.toLowerCase());

        return matchesSearch;
    });

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleAll = () => {
        if (selectedIds.size === filteredData.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredData.map(d => d.id)));
        }
    };

    const [editingDocId, setEditingDocId] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareType, setShareType] = useState<'email' | 'whatsapp' | 'both' | null>(null);
    const [shareDoc, setShareDoc] = useState<{ id: string, name: string } | null>(null);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [docToDelete, setDocToDelete] = useState<string | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState<{ files: string[], name: string }>({ files: [], name: '' });

    const handleEdit = (id: string) => {
        setEditingDocId(id);
        setIsEditModalOpen(true);
    };

    const handleDelete = (id: string) => {
        setDocToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (docToDelete) {
            const success = await documentService.delete('compliance_documents', docToDelete);
            if (success) {
                deleteDocument(docToDelete);
                if (selectedIds.has(docToDelete)) {
                    const newSelected = new Set(selectedIds);
                    newSelected.delete(docToDelete);
                    setSelectedIds(newSelected);
                }
                toast.success("Document deleted");
            } else {
                toast.error("Failed to delete document");
            }
            setDocToDelete(null);
        }
    };

    const openShare = (type: 'email' | 'whatsapp' | 'both', doc: { id: string, name: string }) => {
        setShareType(type);
        setShareDoc(doc);
        setIsShareModalOpen(true);
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

    return (
        <>
            <div className="space-y-4 font-sans">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="min-h-[40px] flex items-center justify-between w-full sm:w-auto gap-4">
                        {selectedIds.size > 0 ? (
                            <div className="flex flex-wrap items-center gap-3 animate-fade-in w-full sm:w-auto">
                                <span className="text-xs text-red-700 font-bold bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 uppercase tracking-wider">
                                    {selectedIds.size} Selected
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openShare('email', { id: 'batch', name: `${selectedIds.size} Compliance Docs` })}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                                    >
                                        <Mail size={14} />
                                        Email
                                    </button>
                                    <button
                                        onClick={() => openShare('whatsapp', { id: 'batch', name: `${selectedIds.size} Compliance Docs` })}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-100"
                                    >
                                        <MessageCircle size={14} />
                                        WhatsApp
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-md font-black text-gray-900 uppercase tracking-tight">Compliance Documents</h2>
                                {navigator}
                            </>
                        )}
                    </div>
                    <div className="flex w-full sm:w-auto gap-2 sm:gap-3">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="SEARCH..."
                                className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 bg-gray-50 text-xs font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-bold"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl transition-all text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg shadow-red-100 select-none active:scale-95"
                        >
                            <Plus className="h-4 w-4 stroke-[3px]" />
                            <span className="hidden sm:inline">Add Compliance</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-red-50 shadow-sm text-[10px] md:text-[11px] uppercase font-black tracking-widest text-gray-950">
                                    <th className="px-4 py-4 w-10 text-center border-r border-red-100 first:rounded-tl-lg">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 bg-white/10"
                                            checked={filteredData.length > 0 && selectedIds.size === filteredData.length}
                                            onChange={toggleAll}
                                        />
                                    </th>
                                    <th className="px-4 py-4 w-14 text-center italic opacity-60">Share</th>
                                    <th className="px-4 py-4 w-24 text-center">Action</th>
                                    <th className="px-4 py-4">Document Title</th>
                                    {/* <th className="px-4 py-4">Type</th> */}
                                    <th className="px-4 py-4 text-center">Validity</th>
                                    <th className="px-4 py-4 text-center">Renewal Date</th>
                                    <th className="px-4 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs md:text-sm divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr key="loading-desktop">
                                        <td colSpan={7} className="p-20 text-center text-gray-400">
                                            <div className="inline-block h-8 w-8 border-4 border-red-100 border-t-red-600 rounded-full animate-spin" />
                                            <p className="mt-2 text-xs font-bold text-gray-500 uppercase">Syncing...</p>
                                        </td>
                                    </tr>
                                ) : filteredData.map((item, index) => (
                                    <tr key={item.id || `comp-${index}`} className={`hover:bg-gray-50/50 transition-colors ${selectedIds.has(item.id) ? 'bg-red-50/30' : ''}`}>
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                                                checked={selectedIds.has(item.id)}
                                                onChange={() => toggleSelection(item.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <DropdownMenu.Root>
                                                <DropdownMenu.Trigger asChild>
                                                    <button className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                                                        <Share2 size={16} />
                                                    </button>
                                                </DropdownMenu.Trigger>
                                                <DropdownMenu.Portal>
                                                    <DropdownMenu.Content className="min-w-[140px] bg-white rounded-lg shadow-lg border border-gray-100 p-1 z-50" sideOffset={5} align="start">
                                                        <DropdownMenu.Item
                                                            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-md cursor-pointer outline-none uppercase"
                                                            onClick={() => openShare('email', { id: item.id, name: item.documentName })}
                                                        >
                                                            <Mail size={14} className="text-blue-600" />
                                                            Email
                                                        </DropdownMenu.Item>
                                                        <DropdownMenu.Item
                                                            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-md cursor-pointer outline-none uppercase"
                                                            onClick={() => openShare('whatsapp', { id: item.id, name: item.documentName })}
                                                        >
                                                            <MessageCircle size={14} className="text-green-600" />
                                                            WhatsApp
                                                        </DropdownMenu.Item>
                                                    </DropdownMenu.Content>
                                                </DropdownMenu.Portal>
                                            </DropdownMenu.Root>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center items-center gap-2">
                                                <button onClick={() => handleEdit(item.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                    <Edit size={14} />
                                                </button>
                                                {item.file ? (
                                                    <button onClick={() => handlePreview(item.file, item.documentName)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="View Document">
                                                        <Eye size={14} />
                                                    </button>
                                                ) : (
                                                    <div className="p-1.5 text-gray-300">
                                                        <Eye size={14} className="opacity-20" />
                                                    </div>
                                                )}
                                                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-900 font-bold">{item.documentName}</td>
                                        {/* <td className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">{item.documentType}</td> */}
                                        <td className="px-4 py-3 text-center text-gray-600 font-bold uppercase text-[11px]">{item.validityPeriod}</td>
                                        <td className="px-4 py-3 text-center text-gray-900 font-medium">{item.renewalDate ? formatDate(item.renewalDate) : '-'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${item.status === 'Completed' || item.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' :
                                                item.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                                    'bg-red-50 text-red-700 border-red-100'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!isLoading && filteredData.length === 0 && (
                            <div className="py-20 text-center">
                                <ShieldCheck size={40} className="mx-auto text-gray-200 mb-2" />
                                <p className="text-gray-500 font-medium">No compliance documents found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile View */}
                <div className="md:hidden grid gap-4">
                    {isLoading ? (
                        <div key="loading-mobile" className="py-10 text-center">
                            <div className="inline-block h-8 w-8 border-4 border-red-100 border-t-red-600 rounded-full animate-spin" />
                        </div>
                    ) : filteredData.map((item, index) => (
                        <div key={item.id || `comp-mobile-${index}`} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900">{item.documentName}</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{item.documentType}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${item.status === 'Completed' || item.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' :
                                    item.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                        'bg-red-50 text-red-700 border-red-100'
                                    }`}>
                                    {item.status}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-50">
                                <button
                                    onClick={() => openShare('both', { id: item.id, name: item.documentName })}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-900 border border-gray-100 rounded-lg hover:bg-gray-100 transition-all font-bold text-[10px] uppercase shadow-sm"
                                >
                                    <Share2 size={14} className="text-gray-400" />
                                    Share
                                </button>
                                <div className="flex gap-2">
                                    {item.file && (
                                        <button onClick={() => handlePreview(item.file, item.documentName)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                            <Eye size={18} />
                                        </button>
                                    )}
                                    <button onClick={() => handleEdit(item.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <AddDocument isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); fetchData(); }} initialCategory="Compliance" lockCategory={true} />
            <EditDocument isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); fetchData(); }} documentId={editingDocId} />
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                type={shareType}
                documentId={shareDoc?.id || ''}
                documentName={shareDoc?.name || ''}
            />
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title="Delete Document"
                message="Are you sure you want to delete this document permanently?"
                confirmText="Delete"
                type="confirm"
            />
            <ConfirmModal
                isOpen={showAlert}
                onClose={() => setShowAlert(false)}
                title="Alert"
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
        </>
    );
};

export default ComplianceDocuments;
