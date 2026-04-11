import { useState } from 'react';
import { FileText, ShieldCheck, CheckCircle, CreditCard } from 'lucide-react';
import CompanyRenewal from './CompanyRenewal';
import CalibrationRenewal from './CalibrationRenewal';
import ProjectApprovalRenewal from './ProjectApprovalRenewal';
import SubscriptionRenewal from './SubscriptionRenewal';

const RenewalsManager = () => {
    const [activeTab, setActiveTab] = useState<'company' | 'calibration' | 'project' | 'subscription'>('company');

    const tabs = [
        { id: 'company', label: 'Company', icon: <FileText size={16} /> },
        { id: 'calibration', label: 'Calibration', icon: <ShieldCheck size={16} /> },
        { id: 'project', label: 'Project', icon: <CheckCircle size={16} /> },
        { id: 'subscription', label: 'Subscription', icon: <CreditCard size={16} /> },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'company': return <CompanyRenewal />;
            case 'calibration': return <CalibrationRenewal />;
            case 'project': return <ProjectApprovalRenewal />;
            case 'subscription': return <SubscriptionRenewal />;
            default: return <CompanyRenewal />;
        }
    };

    return (
        <div className="space-y-4 font-sans">
            {/* Scrollable Tabs */}
            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-20">
                <div className="flex overflow-x-auto no-scrollbar whitespace-nowrap gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${
                                activeTab === tab.id
                                    ? 'bg-red-600 text-white shadow-sm'
                                    : 'text-gray-900 hover:text-red-600 hover:bg-red-50'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div>
                {renderContent()}
            </div>
        </div>
    );
};

export default RenewalsManager;
