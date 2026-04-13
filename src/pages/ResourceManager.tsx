import { useState } from 'react';
import { FileText, CreditCard } from 'lucide-react';
import AllDocuments from './document/CompanyDocuments';
import AllSubscriptions from './subscription/AllSubscriptions';
import { useEffect } from 'react';

const ResourceManager = () => {
  const [activeTab, setActiveTab] = useState<'documents' | 'subscriptions'>('documents');


  return (
    <div className="space-y-4 pb-12">
      {/* Tabs Header */}
      <div className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 flex gap-2">
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'documents'
            ? 'bg-red-50 text-red-700 shadow-sm border border-red-100'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
        >
          <FileText size={16} />
          <span>Documents</span>
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'subscriptions'
            ? 'bg-red-50 text-red-700 shadow-sm border border-red-100'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
        >
          <CreditCard size={16} />
          <span>Subscriptions</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'documents' ? (
          <div>
            <AllDocuments />
          </div>
        ) : (
          <div>
            <AllSubscriptions />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceManager;
