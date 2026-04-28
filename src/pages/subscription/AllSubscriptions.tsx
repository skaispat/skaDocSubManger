import { useState, useEffect } from 'react';
import { Plus, Search, CreditCard, Edit, Trash2, MoreHorizontal, RefreshCw, DollarSign, Building2 } from 'lucide-react';
import useDataStore, { SubscriptionItem } from '../../store/dataStore';
import AddSubscription from './AddSubscription';
import EditSubscription from './EditSubscription';
import { formatDate } from '../../utils/dateFormatter';
import ConfirmModal from '../../components/ConfirmModal';
import { subscriptionService } from '../../api/subscriptionService';
import { toast } from 'react-hot-toast';

const AllSubscriptions = () => {
    const { subscriptions = [], setSubscriptions, deleteSubscription } = useDataStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
                requestedDate: item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                purpose: item.service_name,
                startDate: '',
                endDate: '',
            }));
            setSubscriptions(mappedData);
        } catch (error) {
            toast.error("Failed to fetch subscriptions");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = subscriptions.filter(item => {
        const matchesSearch =
            (String(item.subscriptionName || '').toLowerCase()).includes(searchTerm.toLowerCase()) ||
            (String(item.companyName || '').toLowerCase()).includes(searchTerm.toLowerCase()) ||
            (String(item.sn || '').toLowerCase()).includes(searchTerm.toLowerCase());

        return matchesSearch;
    });

    const [editingSubId, setEditingSubId] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const totalValue = filteredData.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [subToDelete, setSubToDelete] = useState<string | null>(null);

    const handleEdit = (id: string) => {
        setEditingSubId(id);
        setIsEditModalOpen(true);
    };

    const handleDelete = (id: string) => {
        setSubToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (subToDelete) {
            const success = await subscriptionService.delete(subToDelete);
            if (success) {
                deleteSubscription(subToDelete);
                toast.success("Subscription deleted");
            } else {
                toast.error("Failed to delete record");
            }
            setSubToDelete(null);
        }
    };

    return (
        <div className="space-y-4 font-sans">

            {/* Actions & Search */}
            <div className="flex flex-row justify-between items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative flex-1 sm:max-w-xl md:max-w-2xl transition-all">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="SEARCH SUBSCRIPTIONS..."
                        className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 bg-gray-50 text-xs font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-bold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl transition-all text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg shadow-red-100 shrink-0 select-none active:scale-95"
                >
                    <Plus className="h-4 w-4 stroke-[3px]" />
                    <span className="hidden sm:inline">Add Subscription</span>
                    <span className="sm:hidden">Add</span>
                </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 shadow-sm text-[10px] md:text-[11px] uppercase font-black text-gray-950 tracking-widest">
                                <th className="px-5 py-3 first:rounded-tl-lg">Subscription</th>
                                <th className="px-5 py-3">Company</th>
                                <th className="px-5 py-3 text-center">Frequency</th>
                                <th className="px-5 py-3 text-center">Price</th>
                                <th className="px-5 py-3 text-center">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr key="loading-desktop">
                                    <td colSpan={7} className="p-20 text-center">
                                        <div className="inline-block h-8 w-8 border-4 border-red-100 border-t-red-600 rounded-full animate-spin" />
                                    </td>
                                </tr>
                            ) : filteredData.map((item, index) => (
                                <tr key={item.id || `sub-${index}`} className="hover:bg-gray-50/50 transition-colors">

                                    <td className="px-5 py-4">
                                        <div>
                                            <p className="font-bold text-gray-900">{item.subscriptionName}</p>
                                            <p className="text-[10px] text-gray-500 font-medium uppercase">{item.purpose}</p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                                            <Building2 size={14} className="text-gray-400" />
                                            {item.companyName}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-bold uppercase">
                                            {item.frequency}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-center font-bold text-gray-900">₹{parseFloat(item.price).toLocaleString()}</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex justify-center items-center gap-2">
                                            <button onClick={() => handleEdit(item.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                <Edit size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {isLoading ? (
                    <div key="loading-mobile" className="py-10 text-center">
                        <div className="inline-block h-8 w-8 border-4 border-red-100 border-t-red-600 rounded-full animate-spin" />
                    </div>
                ) : filteredData.map((item, index) => (
                    <div key={item.id || `sub-mobile-${index}`} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Subscription Details</p>
                                <h4 className="font-bold text-gray-900 text-sm">{item.subscriptionName}</h4>
                                <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5 tracking-tight">{item.purpose}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm ${item.status === 'Active' ? 'text-green-700 bg-green-50 border border-green-100' : 'text-red-700 bg-red-50 border border-red-100'}`}>
                                {item.status}
                            </span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-t border-gray-50 text-xs">
                            <span className="text-gray-500">{item.companyName}</span>
                            <span className="font-bold text-red-600">₹{parseFloat(item.price).toLocaleString()}</span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-bold uppercase">{item.frequency}</span>
                            <div className="flex gap-2">
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

            <AddSubscription isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); fetchData(); }} />
            <EditSubscription isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); fetchData(); }} subscriptionId={editingSubId} />

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title="Delete Subscription"
                message="Are you sure you want to permanently delete this subscription?"
                confirmText="Delete"
                type="confirm"
            />
        </div>
    );
};
export default AllSubscriptions;
