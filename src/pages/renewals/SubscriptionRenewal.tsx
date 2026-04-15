import { useState, useEffect } from 'react';
import { CheckCircle, X, RotateCcw, Search, Eye, History } from 'lucide-react';
import useDataStore from '../../store/dataStore';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/dateFormatter';
import { documentService } from '../../api/documentService';
import ConfirmModal from '../../components/ConfirmModal';
import RenewalHistoryModal from '../../components/RenewalHistoryModal';

const SubscriptionRenewal = ({ navigator }: { navigator?: React.ReactNode }) => {
    const { subscriptions, subscriptionRenewalHistory, addSubscriptionRenewalHistory, updateSubscription } = useDataStore();

    const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'critical'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [subscriptionDocs, setSubscriptionDocs] = useState<any[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await documentService.getAll('subscription');
            setSubscriptionDocs(data);
        } catch (error) {
            toast.error("Failed to fetch subscriptions");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSub, setSelectedSub] = useState<any | null>(null);
    const [renewalAction, setRenewalAction] = useState<'Approved' | 'Rejected' | ''>('');
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    // History Modal State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyData, setHistoryData] = useState<any[]>([]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const criticalThreshold = new Date(today);
    criticalThreshold.setDate(today.getDate() + 30);

    const baseSubs = subscriptionDocs;

    const searchedSubs = baseSubs.filter(sub =>
        (sub.company_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (sub.subscription_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (sub.id_no?.toString().toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const overdueSubscriptions = searchedSubs.filter(sub => sub.end_date && new Date(sub.end_date) < today);
    const criticalSubscriptions = searchedSubs.filter(sub => {
        if (!sub.end_date) return false;
        const d = new Date(sub.end_date);
        return d >= today && d <= criticalThreshold;
    });

    const getDisplayDocs = () => {
        switch (activeTab) {
            case 'overdue': return overdueSubscriptions;
            case 'critical': return criticalSubscriptions;
            default: return searchedSubs;
        }
    };

    const displaySubs = getDisplayDocs();

    const handleAction = async (sub: any, action: 'Approved' | 'Rejected') => {
        setRenewalAction(action);
        setSelectedSub(sub);
        setIsModalOpen(true);
    };

    const handleViewHistory = async (sub: any) => {
        setSelectedSub(sub);
        setIsLoading(true);
        try {
            const history = await documentService.getRenewalHistory('renew_subscription', sub.id_no);
            setHistoryData(history);
            setIsHistoryOpen(true);
        } catch (error) {
            toast.error("Failed to fetch renewal history");
        } finally {
            setIsLoading(false);
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
            let nextDateStr = selectedSub.end_date;
            if (renewalAction === 'Approved' && selectedSub.end_date) {
                const date = new Date(selectedSub.end_date);
                if (selectedSub.frequency?.toLowerCase().includes('year')) {
                    date.setFullYear(date.getFullYear() + 1);
                } else if (selectedSub.frequency?.toLowerCase().includes('month')) {
                    date.setMonth(date.getMonth() + 1);
                } else if (selectedSub.frequency?.toLowerCase().includes('quarter')) {
                    date.setMonth(date.getMonth() + 3);
                } else {
                    date.setFullYear(date.getFullYear() + 1);
                }
                nextDateStr = date.toISOString().split('T')[0];
            }

            const updates: any = {
                renewal_status: renewalAction
            };
            if (nextDateStr) updates.end_date = nextDateStr;
            if (renewalAction === 'Rejected') updates.status = 'Rejected';

            const success = await documentService.update('subscription', selectedSub.id_no, updates);

            if (success) {
                if (renewalAction === 'Approved') {
                    const renewalData = {
                        doc_id: selectedSub.id_no,
                        company_name: selectedSub.company_name,
                        service_name: selectedSub.subscription_name,
                        frequency: selectedSub.frequency,
                        price: selectedSub.price
                    };
                    await documentService.logRenewal('renew_subscription', renewalData);
                }

                toast.success(renewalAction === 'Approved' ? "Subscription Renewed & Logged" : "Action Logged");
                fetchData();
                handleCloseModal();
            } else {
                toast.error("Failed to update record");
            }
        } catch (error) {
            console.error("Sub Renewal Error:", error);
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4 font-sans">
            <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
                    <div className="flex flex-row justify-between items-center w-full md:w-auto gap-4">
                        <h2 className="text-md font-black text-gray-900 uppercase tracking-tight">Subscription Renewals</h2>
                        {navigator}
                    </div>

                    <div className="flex bg-gray-50 p-1.5 rounded-lg border border-gray-200 w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'all' ? 'bg-white text-gray-950 shadow-md' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            All ({searchedSubs.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('critical')}
                            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'critical' ? 'bg-white text-amber-700 shadow-md' : 'text-amber-600/70 hover:text-amber-700'
                                }`}
                        >
                            Critical ({criticalSubscriptions.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('overdue')}
                            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'overdue' ? 'bg-white text-red-700 shadow-md' : 'text-red-600/70 hover:text-red-700'
                                }`}
                        >
                            Overdue ({overdueSubscriptions.length})
                        </button>
                    </div>
                </div>

                <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="SEARCH ACROSS SUBSCRIPTION RENEWALS..."
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
                                <th className="px-5 py-4 w-40 text-center rounded-tl-xl">Operations</th>
                                <th className="px-5 py-3">Company / Service</th>
                                <th className="px-5 py-3 text-center">Price / Frequency</th>
                                <th className="px-5 py-3 text-center">Renewal Date</th>
                                <th className="px-5 py-3 text-center rounded-tr-xl">Renewal History</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {displaySubs.length > 0 ? displaySubs.map((sub) => {
                                let isOverdue = false;
                                let isCritical = false;

                                if (sub.end_date) {
                                    const endDate = new Date(sub.end_date);
                                    isOverdue = endDate < today;
                                    isCritical = !isOverdue && endDate <= criticalThreshold;
                                }

                                return (
                                    <tr key={sub.id_no} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleAction(sub, 'Approved')} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-green-100 shadow-sm hover:bg-green-100 transition-all">
                                                    Approve
                                                </button>
                                                <button onClick={() => handleAction(sub, 'Rejected')} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-red-100 shadow-sm hover:bg-red-100 transition-all">
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="font-bold text-gray-900">{sub.company_name}</p>
                                            <p className="text-gray-500 text-xs">{sub.subscription_name}</p>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <p className="font-bold text-gray-900">₹{sub.price?.toLocaleString()}</p>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{sub.frequency}</p>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isOverdue ? 'bg-red-50 text-red-700' : isCritical ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                                                {sub.end_date ? formatDate(sub.end_date) : '-'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <button onClick={() => handleViewHistory(sub)} className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all">
                                                <History size={14} /> View History
                                            </button>
                                        </td>
                                    </tr>
                                )
                            }) : (
                                <tr>
                                    <td colSpan={7} className="p-20 text-center text-gray-400">
                                        <CheckCircle size={40} className="mx-auto mb-2 text-green-200" />
                                        <p className="font-medium">No active subscription renewals</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="md:hidden space-y-4">
                {displaySubs.length > 0 ? displaySubs.map((sub) => {
                    let isOverdue = false;
                    let isCritical = false;

                    if (sub.end_date) {
                        const endDate = new Date(sub.end_date);
                        isOverdue = endDate < today;
                        isCritical = !isOverdue && endDate <= criticalThreshold;
                    }

                    return (
                        <div key={sub.id_no} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900">{sub.company_name}</h3>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isOverdue ? 'text-red-700 bg-red-50' : isCritical ? 'text-amber-700 bg-amber-50' : 'text-green-700 bg-green-50'
                                    }`}>
                                    {isOverdue ? 'Overdue' : isCritical ? 'Critical' : 'Healthy'}
                                </span>
                            </div>
                            <div className="space-y-3 pt-3 border-t border-gray-50">
                                <div className="flex justify-between items-center text-xs">
                                    <div>
                                        <p className="font-black text-gray-400 uppercase tracking-tighter text-[9px]">Ends On</p>
                                        <p className="font-bold text-red-600 mt-0.5">{sub.end_date ? formatDate(sub.end_date) : '-'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAction(sub, 'Approved')} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-lg uppercase">
                                            Approve
                                        </button>
                                        <button onClick={() => handleAction(sub, 'Rejected')} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg uppercase">
                                            Reject
                                        </button>
                                    </div>
                                </div>
                                <button onClick={() => handleViewHistory(sub)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-amber-100 shadow-sm transition-all hover:bg-amber-100 active:scale-[0.98]">
                                    <History size={14} /> View Renewal History
                                </button>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-10 text-center text-gray-400">
                        <CheckCircle size={40} className="mx-auto mb-2 text-green-100" />
                        <p className="text-xs">No pending renewals</p>
                    </div>
                )}
            </div>

            {isModalOpen && selectedSub && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Process Renewal</h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-[11px] space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-700 font-bold uppercase tracking-wider">Service:</span>
                                    <span className="font-black text-gray-950">{selectedSub.subscription_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-700 font-bold uppercase tracking-wider">End Date:</span>
                                    <span className="font-black text-red-600">{selectedSub.end_date ? formatDate(selectedSub.end_date) : '-'}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1">Decision Action</label>
                                <select
                                    value={renewalAction}
                                    onChange={(e) => setRenewalAction(e.target.value as 'Approved' | 'Rejected')}
                                    className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-lg text-sm font-bold focus:ring-2 focus:ring-red-100 outline-none"
                                >
                                    <option value="" disabled>Select Outcome</option>
                                    <option value="Approved">Approve Renewal</option>
                                    <option value="Rejected">Terminate Subscription</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-all shadow-sm">
                                    Confirm Action
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmModal isOpen={showAlert} onClose={() => setShowAlert(false)} title="Alert" message={alertMessage} confirmText="Close" type="alert" />
            <RenewalHistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                history={historyData}
                documentName={selectedSub?.company_name || ''}
                type="subscription"
            />
        </div>
    );
};

export default SubscriptionRenewal;
