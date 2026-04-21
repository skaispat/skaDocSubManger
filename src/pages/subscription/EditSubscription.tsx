import React, { useState, useEffect } from 'react';
import useDataStore, { SubscriptionItem } from '../../store/dataStore';
import { toast } from 'react-hot-toast';
import { X, Save, CreditCard, Building2, IndianRupee } from 'lucide-react';
import { subscriptionService, Subscription } from '../../api/subscriptionService';

interface EditSubscriptionProps {
    isOpen: boolean;
    onClose: () => void;
    subscriptionId: string | null;
}

const EditSubscription: React.FC<EditSubscriptionProps> = ({ isOpen, onClose, subscriptionId }) => {
    const { subscriptions, updateSubscription } = useDataStore();
    const [formData, setFormData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && subscriptionId) {
            const sub = subscriptions.find(s => s.id === subscriptionId);
            if (sub) {
                setFormData({
                    id_no: sub.id,
                    company_name: sub.companyName,
                    service_name: sub.subscriptionName,
                    frequency: sub.frequency || 'Monthly',
                    status: sub.status || 'Active',
                    price: sub.price,
                    renewable_date: sub.renewalDate || '',
                    whatsapp_no: sub.whatsappNo || ''
                });
            }
        }
    }, [isOpen, subscriptionId, subscriptions]);

    if (!isOpen || !subscriptionId) return null;

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const payload: Subscription = {
                id_no: formData.id_no,
                company_name: formData.company_name,
                service_name: formData.service_name,
                frequency: formData.frequency,
                status: formData.status,
                price: parseInt(formData.price),
                renewable_date: formData.renewable_date,
                whatsapp_no: formData.whatsapp_no
            };

            const success = await subscriptionService.update(subscriptionId, payload);
            if (success) {
                updateSubscription(subscriptionId, {
                    companyName: formData.company_name,
                    subscriptionName: formData.service_name,
                    frequency: formData.frequency,
                    status: formData.status,
                    price: formData.price,
                    renewalDate: formData.renewable_date,
                    whatsappNo: formData.whatsapp_no
                });
                toast.success("Subscription updated");
                onClose();
            } else {
                toast.error("Failed to update record");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto font-sans">
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                            <CreditCard className="text-red-600" size={28} />
                            Update Plan
                        </h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">ID: {subscriptionId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                    <form id="edit-sub-supabase-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest ml-1">Company Name</label>
                                <div className="relative">
                                    <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-red-100 outline-none text-sm font-bold text-gray-900"
                                        value={formData.company_name || ''}
                                        onChange={e => handleChange('company_name', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest ml-1">Service Description</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-red-100 outline-none text-sm font-bold text-gray-900"
                                    value={formData.service_name || ''}
                                    onChange={e => handleChange('service_name', e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest ml-1">Price (INR)</label>
                                <div className="relative">
                                    <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="number"
                                        required
                                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-red-100 outline-none text-sm font-bold text-red-600"
                                        value={formData.price || ''}
                                        onChange={e => handleChange('price', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest ml-1">Current Status</label>
                                <input
                                    type="text"
                                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-red-100 outline-none text-sm font-bold text-gray-900 uppercase"
                                    value={formData.status || ''}
                                    onChange={e => handleChange('status', e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest ml-1">Renewal Date</label>
                                <input
                                    type="date"
                                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-red-100 outline-none text-sm font-bold text-gray-900"
                                    value={formData.renewable_date || ''}
                                    onChange={e => handleChange('renewable_date', e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest ml-1">WhatsApp No</label>
                                <input
                                    type="tel"
                                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-red-100 outline-none text-sm font-bold text-gray-900"
                                    value={formData.whatsapp_no || ''}
                                    onChange={e => handleChange('whatsapp_no', e.target.value)}
                                    placeholder="919876543210"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex gap-4 px-8 py-6 border-t border-gray-100 bg-gray-50">
                    <button type="button" onClick={onClose} className="flex-1 py-3 px-8 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-gray-900 transition-colors">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="edit-sub-supabase-form"
                        disabled={isSaving}
                        className={`flex-[2] flex items-center justify-center gap-2 py-3 px-8 rounded-xl bg-red-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-all shadow-sm ${isSaving ? 'opacity-50' : ''}`}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditSubscription;
