import React, { useState } from 'react';
import { FileText, ShieldCheck, CheckCircle, CreditCard } from 'lucide-react';
import CompanyRenewal from './CompanyRenewal';
import CalibrationRenewal from './CalibrationRenewal';
import ProjectApprovalRenewal from './ProjectApprovalRenewal';
import ComplianceRenewal from './ComplianceRenewal';
import SubscriptionRenewal from './SubscriptionRenewal';
import MobileTabNavigator from '../../components/MobileTabNavigator';

const RenewalsManager = () => {
    const [activeTab, setActiveTab] = useState<'company' | 'calibration' | 'project' | 'compliance' | 'subscription'>('company');

    const tabs = [
        { id: 'company', label: 'Company', icon: <FileText size={16} /> },
        { id: 'calibration', label: 'Calibration', icon: <ShieldCheck size={16} /> },
        { id: 'project', label: 'Project', icon: <CheckCircle size={16} /> },
        { id: 'compliance', label: 'Compliance', icon: <ShieldCheck size={16} /> },
        { id: 'subscription', label: 'Subscription', icon: <CreditCard size={16} /> },
    ];

    const navigator = (
        <MobileTabNavigator 
            tabs={tabs} 
            activeTab={activeTab} 
            onTabChange={(id) => setActiveTab(id as any)} 
        />
    );

    const renderContent = () => {
        const props = { navigator };
        switch (activeTab) {
            case 'company': return <CompanyRenewal {...props} />;
            case 'calibration': return <CalibrationRenewal {...props} />;
            case 'project': return <ProjectApprovalRenewal {...props} />;
            case 'compliance': return <ComplianceRenewal {...props} />;
            case 'subscription': return <SubscriptionRenewal {...props} />;
            default: return <CompanyRenewal {...props} />;
        }
    };

    return (
        <div className="space-y-4">
            {/* Desktop Scrollable Tabs - Hidden on Mobile */}
            <div className="hidden md:block bg-white p-1 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-20">
                <div className="flex overflow-x-auto no-scrollbar whitespace-nowrap gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === tab.id
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
            <div className="animate-fade-in">
                {renderContent()}
            </div>
        </div>
    );
};

export default RenewalsManager;
