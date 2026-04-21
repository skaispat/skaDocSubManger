import { useState } from 'react';
import { subscriptionService, Subscription } from '../../api/subscriptionService';
import { toast } from 'react-hot-toast';
import { X, Save, Plus, Trash2, CreditCard, Building2, IndianRupee } from 'lucide-react';

interface Entry {
    id: string; // Internal temporary ID
    id_no: string;
    company_name: string;
    service_name: string;
    frequency: string;
    status: string;
    price: string;
    renewable_date: string;
    whatsapp_no: string;
}

interface AddSubscriptionProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddSubscription: React.FC<AddSubscriptionProps> = ({ isOpen, onClose }) => {
    const [entries, setEntries] = useState<Entry[]>([
        {
            id: Math.random().toString(),
            id_no: '',
            company_name: '',
            service_name: '',
            frequency: 'Monthly',
            status: 'Active',
            price: '',
            renewable_date: '',
            whatsapp_no: ''
        }
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleChange = (id: string, field: keyof Entry, value: any) => {
        setEntries(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const addEntry = () => {
        if (entries.length >= 10) {
            toast.error("Max 10 entries allowed");
            return;
        }
        setEntries(prev => [
            ...prev,
            {
                id: Math.random().toString(),
                id_no: '',
                company_name: '',
                service_name: '',
                frequency: 'Monthly',
                status: 'Active',
                price: '',
                renewable_date: '',
                whatsapp_no: ''
            }
        ]);
    };

    const removeEntry = (id: string) => {
        if (entries.length === 1) return;
        setEntries(prev => prev.filter(item => item.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            for (const entry of entries) {
                if (!entry.company_name || !entry.service_name || !entry.price) {
                    toast.error("Please fill all required fields");
                    setIsSubmitting(false);
                    return;
                }

                const payload: Subscription = {
                    company_name: entry.company_name,
                    service_name: entry.service_name,
                    frequency: entry.frequency,
                    status: entry.status,
                    price: parseInt(entry.price),
                    renewable_date: entry.renewable_date,
                    whatsapp_no: entry.whatsapp_no
                } as any;

                await subscriptionService.create(payload);
            }

            toast.success("Successfully added subscriptions");
            onClose();
        } catch (err: any) {
            toast.error("Database Error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto font-sans">
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                            <Plus className="text-red-600" size={28} />
                            Add Subscriptions
                        </h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Bulk Provisioning System</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar bg-gray-50/30">
                    <form id="supabase-sub-form" onSubmit={handleSubmit} className="space-y-6">
                        {entries.map((entry, index) => (
                            <div key={entry.id} className="relative p-6 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-5 group">
                                <div className="flex justify-between items-center -mx-6 -mt-6 p-4 rounded-t-2xl bg-gray-50 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 bg-red-600 rounded-lg flex items-center justify-center text-[10px] font-bold text-white">
                                            {index + 1}
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entry Item</span>
                                    </div>
                                    <button type="button" onClick={() => removeEntry(entry.id)} className="text-gray-300 hover:text-red-600 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 pt-2">
                                    {/* ID Is auto-generated */}

                                    <div className="md:col-span-3 space-y-1.5">
                                        <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Company *</label>
                                        <div className="relative">
                                            <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                required
                                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-base font-bold text-gray-900 transition-colors"
                                                value={entry.company_name}
                                                onChange={e => handleChange(entry.id, 'company_name', e.target.value)}
                                                placeholder="Legal Entity Name"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Service Description *</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full p-3 rounded-xl bg-white border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-base font-bold text-gray-900 transition-colors"
                                            value={entry.service_name}
                                            onChange={e => handleChange(entry.id, 'service_name', e.target.value)}
                                            placeholder="e.g. ERP Cloud"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Price (INR) *</label>
                                        <div className="relative">
                                            <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="number"
                                                required
                                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-base font-bold text-red-600 transition-colors"
                                                value={entry.price}
                                                onChange={e => handleChange(entry.id, 'price', e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Billing cycle</label>
                                        <select
                                            className="w-full p-3 rounded-xl bg-white border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-base font-bold text-gray-900 uppercase transition-colors"
                                            value={entry.frequency}
                                            onChange={e => handleChange(entry.id, 'frequency', e.target.value)}
                                        >
                                            <option value="Monthly">Monthly</option>
                                            <option value="Quarterly">Quarterly</option>
                                            <option value="Half Yearly">Half Yearly</option>
                                            <option value="Yearly">Yearly</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Status</label>
                                        <select
                                            className="w-full p-3 rounded-xl bg-white border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-base font-bold text-gray-900 uppercase transition-colors"
                                            value={entry.status}
                                            onChange={e => handleChange(entry.id, 'status', e.target.value)}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Expired">Expired</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Renewal Date</label>
                                        <input
                                            type="date"
                                            className="w-full p-3 rounded-xl bg-white border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-base font-bold text-gray-900 transition-colors"
                                            value={entry.renewable_date}
                                            onChange={e => handleChange(entry.id, 'renewable_date', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">WhatsApp No</label>
                                        <input
                                            type="tel"
                                            className="w-full p-3 rounded-xl bg-white border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-base font-bold text-gray-900 transition-colors"
                                            value={entry.whatsapp_no}
                                            onChange={e => handleChange(entry.id, 'whatsapp_no', e.target.value)}
                                            placeholder="919876543210"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-center pt-2">
                            <button
                                type="button"
                                onClick={addEntry}
                                className="flex items-center gap-2 px-8 py-3.5 rounded-xl border-2 border-red-100 bg-white text-red-600 text-xs font-black uppercase tracking-widest hover:border-red-600 hover:bg-red-50 shadow-sm transition-all active:scale-95"
                            >
                                <Plus size={18} />
                                Add More
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex gap-4 px-8 py-6 bg-white border-t border-gray-100">
                    <button type="button" onClick={onClose} className="flex-1 py-3 px-8 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
                        Dismiss
                    </button>
                    <button
                        type="submit"
                        form="supabase-sub-form"
                        disabled={isSubmitting}
                        className={`flex-[2] flex items-center justify-center gap-2 py-3 px-8 rounded-xl bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-sm active:scale-95 ${isSubmitting ? 'opacity-50' : ''}`}
                    >
                        {isSubmitting ? 'Syncing...' : 'Add Records'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddSubscription;
