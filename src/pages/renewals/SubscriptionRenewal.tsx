import { useState } from 'react';
import useDataStore, { SubscriptionItem, SubscriptionRenewalItem } from '../../store/dataStore';
import { RotateCcw, X, Check, Search, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/dateFormatter';

const SubscriptionRenewal = () => {
    const { subscriptions, subscriptionRenewalHistory, addSubscriptionRenewalHistory, updateSubscription } = useDataStore();

    const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'critical'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSub, setSelectedSub] = useState<SubscriptionItem | null>(null);
    const [renewalAction, setRenewalAction] = useState<'Approved' | 'Rejected' | ''>('');

    // Partition Subscriptions into Overdue and Critical
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const criticalThreshold = new Date(today);
    criticalThreshold.setDate(today.getDate() + 30);

    const baseSubs = subscriptions.filter(sub => sub.status === 'Paid' && sub.endDate);

    const searchedSubs = baseSubs.filter(sub => 
        (sub.companyName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (sub.subscriptionName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (sub.sn?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const overdueSubscriptions = searchedSubs.filter(sub => {
        const [y, m, d] = sub.endDate.split('-').map(Number);
        const endDate = new Date(y, m - 1, d);
        return endDate < today;
    });

    const criticalSubscriptions = searchedSubs.filter(sub => {
        const [y, m, d] = sub.endDate.split('-').map(Number);
        const endDate = new Date(y, m - 1, d);
        return endDate >= today && endDate <= criticalThreshold;
    });

    const getDisplayDocs = () => {
        switch (activeTab) {
            case 'overdue': return overdueSubscriptions;
            case 'critical': return criticalSubscriptions;
            default: return searchedSubs;
        }
    };

    const displaySubs = getDisplayDocs();

    const handleAction = (sub: SubscriptionItem) => {
        setSelectedSub(sub);
        setRenewalAction(''); 
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSub(null);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSub || !renewalAction) {
            toast.error("Please select an action");
            return;
        }

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

        if (renewalAction === 'Approved') {
            const [y, m, d] = selectedSub.endDate.split('-').map(Number);
            const date = new Date(y, m - 1, d);
            
            if (selectedSub.frequency.toLowerCase().includes('year')) {
                date.setFullYear(date.getFullYear() + 1);
            } else if (selectedSub.frequency.toLowerCase().includes('month')) {
                date.setMonth(date.getMonth() + 1);
            } else if (selectedSub.frequency.toLowerCase().includes('quarter')) {
                date.setMonth(date.getMonth() + 3);
            } else {
                date.setFullYear(date.getFullYear() + 1);
            }

            const newDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            
            updateSubscription(selectedSub.id, { 
                endDate: newDateStr,
                renewalStatus: 'Approved' 
            });
            toast.success(`Subscription Renewed!`);
        } else {
            updateSubscription(selectedSub.id, { 
                status: 'Rejected', 
                renewalStatus: 'Rejected' 
            });
            toast.success("Subscription Renewal Rejected");
        }

        handleCloseModal();
    };

    return (
        <div className="space-y-4 font-sans">
            {/* Header / Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative flex-1 w-full max-w-lg">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="SEARCH SUBSCRIPTIONS..."
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
                        <span className="ml-1 opacity-50">{searchedSubs.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('critical')}
                        className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                            activeTab === 'critical' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <span>Critical</span>
                        <span className="ml-1 opacity-50">{criticalSubscriptions.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('overdue')}
                        className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                            activeTab === 'overdue' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <span>Overdue</span>
                        <span className="ml-1 opacity-50">{overdueSubscriptions.length}</span>
                    </button>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-red-50 shadow-sm border-b border-gray-100 text-[10px] md:text-[11px] uppercase text-gray-950 font-black tracking-widest">
                                <th className="px-5 py-4 w-32 text-center rounded-tl-xl">Payment Status</th>
                                <th className="px-5 py-3">Reference No</th>
                                <th className="px-5 py-3">Company</th>
                                <th className="px-5 py-3">Service</th>
                                <th className="px-5 py-3 text-center">Frequency</th>
                                <th className="px-5 py-3 text-center">Price</th>
                                <th className="px-5 py-3 text-center">End Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {displaySubs.length > 0 ? displaySubs.map((sub) => {
                                const [y, m, d] = sub.endDate.split('-').map(Number);
                                const endDate = new Date(y, m - 1, d);
                                const isOverdue = endDate < today;
                                const isCritical = !isOverdue && endDate <= criticalThreshold;

                                return (
                                    <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4 text-center">
                                            <button
                                                onClick={() => handleAction(sub)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded hover:bg-red-700 transition-colors"
                                            >
                                                Process
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 text-xs font-medium text-gray-500">{sub.sn}</td>
                                        <td className="px-5 py-4 font-bold text-gray-900">{sub.companyName}</td>
                                        <td className="px-5 py-4 text-gray-600 font-medium text-sm">{sub.subscriptionName}</td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-bold uppercase">{sub.frequency}</span>
                                        </td>
                                        <td className="px-5 py-4 text-center font-bold text-gray-900">₹{sub.price}</td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                isOverdue ? 'bg-red-50 text-red-700' : 
                                                isCritical ? 'bg-amber-50 text-amber-700' : 
                                                'bg-green-50 text-green-700'
                                            }`}>
                                                {formatDate(sub.endDate)}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            }) : (
                                <tr>
                                    <td colSpan={7} className="p-20 text-center text-gray-400">
                                        <Check size={40} className="mx-auto mb-2 text-green-200" />
                                        <p className="font-medium">No active subscription renewals</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {displaySubs.length > 0 ? displaySubs.map((sub) => {
                    const [y, m, d] = sub.endDate.split('-').map(Number);
                    const endDate = new Date(y, m - 1, d);
                    const isOverdue = endDate < today;
                    const isCritical = !isOverdue && endDate <= criticalThreshold;

                    return (
                        <div key={sub.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900">{sub.companyName}</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">ID: {sub.sn}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    isOverdue ? 'text-red-700 bg-red-50' : isCritical ? 'text-amber-700 bg-amber-50' : 'text-green-700 bg-green-50'
                                }`}>
                                    {isOverdue ? 'Overdue' : isCritical ? 'Critical' : 'Healthy'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-50">
                                <div>
                                    <p className="font-bold text-gray-800">{sub.subscriptionName}</p>
                                    <p className="text-gray-500 mt-0.5">Ends: {formatDate(sub.endDate)}</p>
                                </div>
                                <button 
                                    onClick={() => handleAction(sub)}
                                    className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-[10px] uppercase rounded"
                                >
                                    Renew
                                </button>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-10 text-center text-gray-400">
                        <Check size={40} className="mx-auto mb-2 text-green-100" />
                        <p className="text-xs">No pending renewals</p>
                    </div>
                )}
            </div>

            {/* Modal */}
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
                             <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Service:</span>
                                    <span className="font-bold text-gray-900">{selectedSub.subscriptionName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">End Date:</span>
                                    <span className="font-bold text-red-600">{formatDate(selectedSub.endDate)}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-900 uppercase tracking-widest mb-1">Decision Action</label>
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
        </div>
    );
};

export default SubscriptionRenewal;
