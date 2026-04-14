import { useState, useEffect } from 'react';
import useDataStore, { SubscriptionItem, SubscriptionRenewalItem } from '../../store/dataStore';
import { RotateCcw, X, Check, Search, RefreshCw, CreditCard, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/dateFormatter';
import { subscriptionService, Subscription } from '../../api/subscriptionService';
import { documentService } from '../../api/documentService';
import PreviewModal from '../../components/PreviewModal';
import EditDocument from '../document/EditDocument';

const SubscriptionRenewal = () => {
    const { subscriptions = [], setSubscriptions, subscriptionRenewalHistory, addSubscriptionRenewalHistory, updateSubscription } = useDataStore();

    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [categoryTab, setCategoryTab] = useState<'subscriptions' | 'calibration' | 'projects' | 'compliance'>('subscriptions');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Document Specific State
    const [documentRenewals, setDocumentRenewals] = useState<any[]>([]);
    const [editingDocId, setEditingDocId] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSub, setSelectedSub] = useState<SubscriptionItem | null>(null);
    const [renewalAction, setRenewalAction] = useState<'Approved' | 'Rejected' | ''>('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState<{ files: string[], name: string }>({ files: [], name: '' });

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
            if (categoryTab === 'subscriptions') {
                const data = await subscriptionService.getAll();
                const mappedData: SubscriptionItem[] = data.map(item => ({
                    id: item.id_no,
                    sn: item.id_no,
                    companyName: item.company_name,
                    subscriberName: item.company_name,
                    subscriptionName: item.service_name,
                    price: item.price?.toString() || '0',
                    frequency: item.frequency || 'Monthly',
                    status: item.status || 'Active',
                    requestedDate: item.created_at?.split('T')[0] || '',
                    purpose: item.service_name,
                    startDate: item.created_at?.split('T')[0] || '',
                    endDate: item.created_at?.split('T')[0] || '',
                }));
                setSubscriptions(mappedData);
            } else {
                const typeMap: Record<string, any> = {
                    calibration: 'calibration_certificate',
                    projects: 'project_approval',
                    compliance: 'compliance_documents'
                };
                const data = await documentService.getAll(typeMap[categoryTab]);
                // Filter for renewable items and map them
                const filtered = data.filter(item =>
                    item.renewable?.toString().toLowerCase() === 'yes'
                ).map(item => ({
                    id: item.id_no,
                    sn: item.id_no,
                    companyName: item.brand_name || 'SKA Group',
                    documentName: item.instrument_name || item.document_name,
                    type: item.document_type || categoryTab,
                    renewalDate: item.renewable_date,
                    status: item.status_of_document || 'Active',
                    documentView: item.document_view, // Added for preview
                    subscriptionName: item.instrument_name || item.document_name // Add for mobile compatibility
                }));
                setDocumentRenewals(filtered);
            }
        } catch (error) {
            toast.error(`Failed to sync ${categoryTab}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [categoryTab]);

    const getFilteredData = () => {
        const data = categoryTab === 'subscriptions' ? (activeTab === 'pending' ? pendingSubscriptions : filteredHistory) : documentRenewals;
        return data.filter((item: any) =>
            (item.companyName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (item.subscriptionName?.toLowerCase() || item.documentName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (item.sn?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    };

    const handleAction = (item: any) => {
        if (categoryTab === 'subscriptions') {
            setSelectedSub(item);
            setRenewalAction('');
            setIsModalOpen(true);
        } else {
            setEditingDocId(item.id);
            setIsEditModalOpen(true);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSub(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSub || !renewalAction) {
            toast.error("Please select an action");
            return;
        }

        setIsLoading(true);

        try {
            const payload: Partial<Subscription> = {
                status: renewalAction === 'Approved' ? 'Active' : 'Rejected'
            };

            const success = await subscriptionService.update(selectedSub.id, payload);

            if (success) {
                const rnNumber = `RN-${String(subscriptionRenewalHistory.length + 1).padStart(3, '0')}`;

                const newItem: SubscriptionRenewalItem = {
                    id: Math.random().toString(36).substr(2, 9),
                    renewalNo: rnNumber,
                    subscriptionId: selectedSub.id,
                    sn: selectedSub.sn,
                    companyName: selectedSub.companyName,
                    subscriberName: selectedSub.subscriberName,
                    subscriptionName: selectedSub.subscriptionName,
                    frequency: selectedSub.frequency,
                    price: selectedSub.price,
                    endDate: selectedSub.endDate,
                    renewalStatus: renewalAction
                };

                addSubscriptionRenewalHistory(newItem);
                updateSubscription(selectedSub.id, {
                    status: payload.status,
                    renewalStatus: renewalAction
                });

                toast.success(`Action ${renewalAction} synced`);
                handleCloseModal();
            } else {
                toast.error("Failed to update database");
            }
        } catch (err) {
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
                        <h2 className="text-sm sm:text-base font-bold text-gray-500 uppercase tracking-widest">Renewal Protocol</h2>
                    </div>
                    
                    <div className="flex bg-gray-100 p-1.5 rounded-lg border border-gray-200 w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`flex-1 sm:flex-none px-6 py-2 text-xs font-black uppercase tracking-widest rounded-md transition-all ${
                                activeTab === 'pending' ? 'bg-white text-gray-950 shadow-md' : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 sm:flex-none px-6 py-2 text-xs font-black uppercase tracking-widest rounded-md transition-all ${
                                activeTab === 'history' ? 'bg-white text-gray-950 shadow-md' : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            History
                        </button>
                    </div>
                </div>

                <div className="relative w-full flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="SEARCH ACROSS RENEWAL DATABASE..."
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

            {/* Category Sub-Tabs */}
            <div className="flex flex-wrap gap-2 px-1">
                {[
                    { id: 'subscriptions', label: 'Subscriptions', icon: <CreditCard size={14} /> },
                    { id: 'calibration', label: 'Calibration', icon: <RefreshCw size={14} /> },
                    { id: 'projects', label: 'Projects', icon: <Check size={14} /> },
                    { id: 'compliance', label: 'Compliance', icon: <RefreshCw size={14} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setCategoryTab(tab.id as any)}
                        className={`flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${categoryTab === tab.id
                            ? 'bg-red-600 text-white border-red-600 shadow-lg transform scale-105 z-10'
                            : 'bg-white text-gray-900 border-gray-100 hover:border-red-200 hover:bg-red-50/30'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-red-50 shadow-sm border-b border-gray-100 text-[10px] md:text-[11px] uppercase text-gray-950 font-black tracking-widest">
                                {activeTab === 'pending' ? (
                                    <>
                                        <th className="px-5 py-4 w-32 text-center rounded-tl-xl">Action</th>
                                        <th className="px-5 py-3">Company</th>
                                        <th className="px-5 py-3">Service</th>
                                        <th className="px-5 py-3 text-center">Frequency</th>
                                        <th className="px-5 py-3 text-center">Price</th>
                                        <th className="px-5 py-3 text-center">Status</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-5 py-4 w-40 text-left rounded-tl-xl">Outcome</th>
                                        <th className="px-5 py-3">Company</th>
                                        <th className="px-5 py-3">Service</th>
                                        {categoryTab !== 'subscriptions' && <th className="px-5 py-3 text-center">View</th>}
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="p-20 text-center text-gray-400">
                                        <div className="inline-block h-8 w-8 border-4 border-red-100 border-t-red-600 rounded-full animate-spin" />
                                        <p className="mt-4 text-sm font-black uppercase tracking-widest">Syncing Protocols...</p>
                                    </td>
                                </tr>
                            ) : getFilteredData().length > 0 ? (
                                getFilteredData().map((item: any) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        {categoryTab === 'subscriptions' ? (
                                            activeTab === 'pending' ? (
                                                <>
                                                    <td className="px-5 py-4 text-center">
                                                        <button
                                                            onClick={() => handleAction(item)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded hover:bg-red-700 transition-colors shadow-sm"
                                                        >
                                                            <RotateCcw size={14} />
                                                            Renew
                                                        </button>
                                                    </td>
                                                    <td className="px-5 py-4 font-bold text-gray-900">{item.companyName}</td>
                                                    <td className="px-5 py-4 text-gray-600 text-sm font-medium">{item.subscriptionName}</td>
                                                    <td className="px-5 py-4 text-center">
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-bold uppercase">{item.frequency}</span>
                                                    </td>
                                                    <td className="px-5 py-4 text-center font-bold text-gray-900">₹{parseFloat(item.price).toLocaleString()}</td>
                                                    <td className="px-5 py-4 text-center">
                                                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold uppercase">
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-5 py-4">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.renewalStatus === 'Approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                                            }`}>
                                                            {item.renewalStatus}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 font-bold text-gray-900">{item.companyName}</td>
                                                    <td className="px-5 py-4 text-gray-600 font-medium text-sm">{item.subscriptionName}</td>
                                                </>
                                            )
                                        ) : (
                                            <>
                                                <td className="px-5 py-4 text-center">
                                                    <button
                                                        onClick={() => handleAction(item)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded hover:bg-blue-700 transition-colors shadow-sm"
                                                    >
                                                        <RefreshCw size={14} />
                                                        Update
                                                    </button>
                                                </td>
                                                <td className="px-5 py-4 font-bold text-gray-900">{item.companyName}</td>
                                                <td className="px-5 py-4 text-gray-600 text-sm font-medium">{item.documentName}</td>
                                                <td className="px-5 py-4 text-center font-bold text-red-600 tracking-tight">{formatDate(item.renewalDate)}</td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                                        }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-center border-l border-gray-50">
                                                    {item.documentView ? (
                                                        <button onClick={() => handlePreview(item.documentView, item.documentName)} className="text-blue-600 hover:text-blue-700 transition-colors" title="View Document">
                                                            <Eye size={18} />
                                                        </button>
                                                    ) : <span className="text-gray-300 font-bold">-</span>}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="p-20 text-center text-gray-400">
                                        <CreditCard className="mx-auto mb-2 text-gray-200" size={40} />
                                        <p className="font-bold text-xs uppercase tracking-widest">No matching protocol records</p>
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
                    <div className="py-20 text-center">
                        <p className="text-sm text-gray-400">Syncing...</p>
                    </div>
                ) : getFilteredData().map((item: any) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-gray-900">{categoryTab === 'subscriptions' ? item.subscriptionName : item.documentName}</h3>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${categoryTab === 'subscriptions' ? (activeTab === 'pending' ? 'bg-amber-50 text-amber-700' : (item.renewalStatus === 'Approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'))
                                : (item.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')
                                }`}>
                                {categoryTab === 'subscriptions'
                                    ? (activeTab === 'pending' ? 'PENDING' : item.renewalStatus)
                                    : item.status}
                            </span>
                        </div>

                        <div className="pt-2 border-t border-gray-50 flex justify-between items-center text-xs">
                            <div>
                                <p className="text-gray-500 uppercase text-[10px] font-bold">Company</p>
                                <p className="font-bold text-gray-900">{item.companyName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-500 uppercase text-[10px] font-bold">
                                    {categoryTab === 'subscriptions' ? 'Price' : 'Renewal'}
                                </p>
                                <p className={`font-bold ${categoryTab === 'subscriptions' ? 'text-red-600' : 'text-blue-600'}`}>
                                    {categoryTab === 'subscriptions' ? `₹${parseFloat(item.price).toLocaleString()}` : formatDate(item.renewalDate)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <div className="flex gap-2 items-center">
                                <span className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-[10px] font-bold uppercase">
                                    {categoryTab === 'subscriptions' ? item.frequency : (item.type || categoryTab)}
                                </span>
                                {item.documentView && (
                                    <button onClick={() => handlePreview(item.documentView, item.documentName || item.subscriptionName)} className="p-1 text-blue-600">
                                        <Eye size={16} />
                                    </button>
                                )}
                            </div>
                            {(categoryTab !== 'subscriptions' || activeTab === 'pending') && (
                                <button onClick={() => handleAction(item)} className={`px-4 py-1.5 text-white text-[10px] font-bold uppercase rounded transition-all ${categoryTab === 'subscriptions' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                    {categoryTab === 'subscriptions' ? 'Process' : 'Update'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Renewal Modal */}
            {isModalOpen && selectedSub && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Renewal Protocol</h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Target Plan:</span>
                                    <span className="font-bold text-gray-900">{selectedSub.subscriptionName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Resource Price:</span>
                                    <span className="font-bold text-red-600">₹{parseFloat(selectedSub.price).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">Decision Action</label>
                                <select
                                    value={renewalAction}
                                    onChange={(e) => setRenewalAction(e.target.value as 'Approved' | 'Rejected')}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-red-100 outline-none uppercase"
                                >
                                    <option value="" disabled>Select Directive...</option>
                                    <option value="Approved">Approve / Active</option>
                                    <option value="Rejected">Terminate / Reject</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-50">
                                    Dismiss
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all ${isLoading ? 'opacity-50' : ''}`}
                                >
                                    {isLoading ? 'Processing...' : 'Confirm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <EditDocument
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    fetchData();
                }}
                documentId={editingDocId}
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

export default SubscriptionRenewal;
