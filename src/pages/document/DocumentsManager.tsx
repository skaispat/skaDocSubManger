import React, { useState } from 'react';
import { FileText, ShieldCheck, CheckCircle, Share2 } from 'lucide-react';
import AllDocuments from './CompanyDocuments';
import CalibrationCertificate from './CalibrationCertifiicate';
import ProjectApproval from './ProjectApproval';
import ComplianceDocuments from './ComplianceDocuments';
import SharedDocuments from './Shared';
import MobileTabNavigator from '../../components/MobileTabNavigator';

const DocumentsManager = () => {
    const [activeTab, setActiveTab] = useState<'all' | 'calibration' | 'project' | 'compliance' | 'shared'>('all');

    const tabs = [
        { id: 'all', label: 'Company Documents', icon: <FileText size={16} /> },
        { id: 'calibration', label: 'Calibration Certificate', icon: <ShieldCheck size={16} /> },
        { id: 'project', label: 'Project Approval', icon: <CheckCircle size={16} /> },
        { id: 'compliance', label: 'Compliance Docs', icon: <ShieldCheck size={16} /> },
        { id: 'shared', label: 'Shared History', icon: <Share2 size={16} /> },
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
            case 'all': return <AllDocuments {...props} />;
            case 'calibration': return <CalibrationCertificate {...props} />;
            case 'project': return <ProjectApproval {...props} />;
            case 'compliance': return <ComplianceDocuments {...props} />;
            case 'shared': return <SharedDocuments {...props} />;
            default: return <AllDocuments {...props} />;
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

export default DocumentsManager;
