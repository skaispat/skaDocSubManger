import { useState, useEffect } from 'react';
import { Plus, Search, CreditCard, FileText } from 'lucide-react';
import useDataStore from '../../store/dataStore';
import useHeaderStore from '../../store/headerStore';
import { formatDate } from '../../utils/dateFormatter';
import AddSubscription from './AddSubscription';

const AllSubscriptions = () => {
  const { setTitle } = useHeaderStore();
  const { subscriptions, resetSubscriptions } = useDataStore();

  useEffect(() => {
    setTitle('All Subscription');
  }, [setTitle]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFrequency, setFilterFrequency] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const hasBadData = subscriptions.some(item => !item.companyName);
    if (subscriptions.length === 0 || hasBadData) {
         if (resetSubscriptions) resetSubscriptions(); 
    }
  }, [subscriptions, resetSubscriptions]);
  
  const filteredData = subscriptions.filter(item => {
    const matchesSearch = (item.subscriptionName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.subscriberName || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesfreq = filterFrequency ? item.frequency === filterFrequency : true;

    return matchesSearch && matchesfreq;
  });

  return (
    <>
    <div className="space-y-3">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-white p-3 rounded-xl shadow-input">
        <div className="min-h-[32px] flex items-center">
             <h1 className="text-xl font-bold text-gray-800">All Subscriptions</h1>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
            <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                    type="text"
                    placeholder="Search subscriptions..."
                    className="pl-9 pr-4 py-2 w-full shadow-input border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="relative">
               <select
                   value={filterFrequency}
                   onChange={(e) => setFilterFrequency(e.target.value)}
                   className="appearance-none pl-3 pr-8 py-2 shadow-input border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 text-gray-700 text-xs font-medium cursor-pointer hover:bg-gray-100 w-full sm:w-auto"
               >
                   <option value="">All Frequencies</option>
                   {Array.from(new Set(subscriptions.map(s => s.frequency))).filter(Boolean).sort().map(freq => (
                       <option key={freq} value={freq}>{freq}</option>
                   ))}
               </select>
               <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
               </div>
            </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-all shadow-md text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add New</span>
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:flex flex-col bg-white rounded-xl shadow-input overflow-hidden h-[calc(100vh-280px)]">
        <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
                <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider whitespace-nowrap">
                <th className="px-3 py-2 bg-gray-50">S.N.</th>
                <th className="px-3 py-2 bg-gray-50">Requested</th>
                <th className="px-3 py-2 bg-gray-50">Company</th>
                <th className="px-3 py-2 bg-gray-50">Subscriber</th>
                <th className="px-3 py-2 bg-gray-50">Service/Name</th>
                <th className="px-3 py-2 bg-gray-50">Price</th>
                <th className="px-3 py-2 bg-gray-50">Freq.</th>
                <th className="px-3 py-2 bg-gray-50">Status</th>
                </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
                {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-3 py-1.5 font-bold text-gray-700 text-xs">{item.sn}</td>
                    <td className="px-3 py-1.5 text-gray-600 whitespace-nowrap text-xs">{formatDate(item.requestedDate)}</td>
                    <td className="px-3 py-1.5 font-medium text-gray-900">{item.companyName}</td>
                    <td className="px-3 py-1.5 text-gray-700 text-xs">{item.subscriberName}</td>
                    <td className="px-3 py-1.5 font-medium text-red-600">{item.subscriptionName}</td>
                    <td className="px-3 py-1.5 font-medium text-gray-900">{item.price}</td>
                    <td className="px-3 py-1.5 text-gray-600 text-xs">{item.frequency}</td>
                    <td className="px-3 py-1.5">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}>
                        {item.status || 'Pending'}
                    </span>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden flex flex-col gap-3">
        {filteredData.map((item) => (
          <div key={item.id} className="bg-white p-3 rounded-xl shadow-input space-y-2">
             <div className="flex justify-between items-start">
                <div className="flex gap-2 items-start">
                   <div className="h-8 w-8 flex items-center justify-center bg-red-50 text-red-600 rounded-lg shrink-0 mt-0.5">
                      <CreditCard size={16} />
                   </div>
                   <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                         <span className="text-[9px] font-mono font-bold text-gray-500 bg-gray-100 px-1 py-0.5 rounded uppercase">{item.sn}</span>
                         <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                             item.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-50 text-gray-600 border border-gray-200'
                         }`}>
                             {item.status || 'Pending'}
                         </span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 leading-tight">{item.subscriptionName}</h3>
                      <p className="text-[11px] text-gray-500 font-medium">{item.companyName}</p>
                   </div>
                </div>
                <p className="font-bold text-gray-900 text-sm">{item.price}</p>
             </div>
             
             <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-gray-50">
                <div className="flex justify-between">
                    <span className="text-gray-400">Subscriber:</span>
                    <span className="font-medium text-gray-700">{item.subscriberName}</span>
                </div>
                <div className="flex justify-between">
                     <span className="text-gray-400">Frequency:</span>
                     <span className="font-medium text-gray-700">{item.frequency}</span>
                </div>
             </div>
          </div>
        ))}
         {filteredData.length === 0 && (
            <div className="p-8 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                <p className="text-sm">No subscriptions found</p>
            </div>
        )}
      </div>
    </div>
    <AddSubscription isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </>
  );
};
export default AllSubscriptions;
