import { useState, useEffect } from 'react';
import useDataStore, { SubscriptionItem, SubscriptionRenewalItem } from '../../store/dataStore';
import { RotateCcw, X, Check, Search, RefreshCw, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/dateFormatter';
import { subscriptionService, Subscription } from '../../api/subscriptionService';

const SubscriptionRenewal = () => {
    const { subscriptions = [], setSubscriptions, subscriptionRenewalHistory, addSubscriptionRenewalHistory, updateSubscription } = useDataStore();

    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSub, setSelectedSub] = useState<SubscriptionItem | null>(null);
    const [renewalAction, setRenewalAction] = useState<'Approved' | 'Rejected' | ''>('');

    const fetchData = async () => {
        setIsLoading(true);
        try {
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
        } catch (error) {
            // Silently fail or use toast
            toast.error("Failed to sync subscriptions");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const pendingSubscriptions = subscriptions.filter(sub => 
        (sub.companyName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (sub.subscriptionName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (sub.sn?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const filteredHistory = subscriptionRenewalHistory.filter(item => 
        (item.companyName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.subscriptionName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.sn?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const handleAction = (sub: SubscriptionItem) => {
        setSelectedSub(sub);
        setRenewalAction(''); 
        setIsModalOpen(true);
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
            {/* Header / Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                        onClick={fetchData} 
                        disabled={isLoading}
                        className={`p-2 text-gray-400 hover:text-red-600 transition-colors ${isLoading ? 'animate-spin' : ''}`}
                    >
                        <RefreshCw size={18} />
                    </button>
                    <div className="relative flex-1 sm:w-80">
                         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                         <input
                             type="text"
                             placeholder="Search renewals..."
                             className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 bg-gray-50 text-sm"
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                         />
                    </div>
                </div>

                <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                            activeTab === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                            activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        History
                    </button>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-[11px] uppercase text-gray-900 font-bold tracking-wider">
                                {activeTab === 'pending' ? (
                                    <>
                                        <th className="px-5 py-3 w-32 text-center">Action</th>
                                        <th className="px-5 py-3">Sub ID</th>
                                        <th className="px-5 py-3">Company</th>
                                        <th className="px-5 py-3">Service</th>
                                        <th className="px-5 py-3 text-center">Frequency</th>
                                        <th className="px-5 py-3 text-center">Price</th>
                                        <th className="px-5 py-3 text-center">Status</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-5 py-3">Renewal No</th>
                                        <th className="px-5 py-3">Sub No</th>
                                        <th className="px-5 py-3">Company</th>
                                        <th className="px-5 py-3">Service</th>
                                        <th className="px-5 py-3 text-center">Outcome</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="p-20 text-center text-gray-400">
                                         <p className="text-sm font-medium">Syncing data...</p>
                                    </td>
                                </tr>
                            ) : (activeTab === 'pending' ? pendingSubscriptions : filteredHistory).length > 0 ? (
                                (activeTab === 'pending' ? pendingSubscriptions : filteredHistory).map((item: any) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        {activeTab === 'pending' ? (
                                            <>
                                                <td className="px-5 py-4 text-center">
                                                    <button
                                                        onClick={() => handleAction(item)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded hover:bg-red-700 transition-colors"
                                                    >
                                                        <RotateCcw size={14} />
                                                        Renew
                                                    </button>
                                                </td>
                                                <td className="px-5 py-4 text-xs font-medium text-gray-500">{item.sn}</td>
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
                                                <td className="px-5 py-4 text-xs font-bold text-red-600">{item.renewalNo}</td>
                                                <td className="px-5 py-4 text-xs font-medium text-gray-500">{item.sn}</td>
                                                <td className="px-5 py-4 font-bold text-gray-900">{item.companyName}</td>
                                                <td className="px-5 py-4 text-gray-600 font-medium text-sm">{item.subscriptionName}</td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                        item.renewalStatus === 'Approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                                    }`}>
                                                        {item.renewalStatus}
                                                    </span>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="p-20 text-center text-gray-400">
                                        <CreditCard className="mx-auto mb-2 text-gray-200" size={40} />
                                        <p className="font-medium text-sm">No records found</p>
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
                ) : (activeTab === 'pending' ? pendingSubscriptions : filteredHistory).map((item: any) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-gray-900">{item.subscriptionName}</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5 leading-none">ID: {item.sn}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                activeTab === 'pending' ? 'bg-amber-50 text-amber-700' : 
                                (item.renewalStatus === 'Approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600')
                            }`}>
                                {activeTab === 'pending' ? 'PENDING' : item.renewalStatus}
                            </span>
                        </div>
                        
                        <div className="pt-2 border-t border-gray-50 flex justify-between items-center text-xs">
                            <div>
                                <p className="text-gray-500 uppercase text-[10px] font-bold">Company</p>
                                <p className="font-bold text-gray-900">{item.companyName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-500 uppercase text-[10px] font-bold">Price</p>
                                <p className="font-bold text-red-600">₹{parseFloat(item.price).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <span className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-[10px] font-bold uppercase">{item.frequency}</span>
                            {activeTab === 'pending' && (
                                <button onClick={() => handleAction(item)} className="px-4 py-1.5 bg-red-600 text-white text-[10px] font-bold uppercase rounded hover:bg-red-700">
                                    Process
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Renewal Modal */}
            {isModalOpen && selectedSub && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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
        </div>
    );
};

export default SubscriptionRenewal;
