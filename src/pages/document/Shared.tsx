import { useState } from 'react';
import { Search, FileText, Download, Mail, MessageCircle } from 'lucide-react';
import useDataStore from '../../store/dataStore';
import { formatDate } from '../../utils/dateFormatter';

const SharedDocuments = () => {
    const { shareHistory } = useDataStore();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = shareHistory.filter(item => 
        (item.shareNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.docName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.recipientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.docSerial || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.contactInfo || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 font-sans">
             {/* Search Header */}
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Share History</h2>
                <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="SEARCH SHARE DATA..."
                            className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 bg-gray-50 text-xs font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
             </div>

             {/* Desktop Table View */}
             <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-[11px] uppercase text-gray-900 font-bold tracking-wider">
                                <th className="px-6 py-4">Share No.</th>
                                <th className="px-6 py-4">Date & Time</th>
                                <th className="px-6 py-4">Serial No.</th>
                                <th className="px-6 py-4">Document Name</th>
                                <th className="px-6 py-4 text-center">Shared Via</th>
                                <th className="px-6 py-4">Recipient Name</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4 text-center">View</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredData.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-black text-gray-900">{item.shareNo}</td>
                                    <td className="px-6 py-4 text-xs text-gray-900 font-bold whitespace-nowrap">{formatDate(item.dateTime)}</td>
                                    <td className="px-6 py-4 text-xs text-gray-900 font-black tracking-tight">{item.docSerial}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                                <FileText size={16} className="text-red-600" />
                                            </div>
                                            <span className="text-sm font-black text-gray-900 truncate max-w-[220px]" title={item.docName}>{item.docName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase text-gray-900 tracking-widest">
                                            {item.sharedVia === 'Email' ? <Mail size={14} className="text-blue-600"/> : <MessageCircle size={14} className="text-green-600"/>}
                                            {item.sharedVia}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 font-black">{item.recipientName}</td>
                                    <td className="px-6 py-4 text-xs text-gray-900 font-bold whitespace-nowrap opacity-60">{item.contactInfo}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                            <Download size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {filteredData.length === 0 && (
                     <div className="p-20 text-center">
                         <div className="inline-flex p-6 bg-gray-50 rounded-[2rem] mb-4">
                            <FileText size={48} className="text-gray-200" />
                         </div>
                         <p className="text-gray-900 font-black uppercase text-xs tracking-widest opacity-40">No sharing records found</p>
                     </div>
                 )}
             </div>

             {/* Mobile Card View */}
             <div className="md:hidden space-y-4">
                 {filteredData.map((item) => (
                     <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                         <div className="flex justify-between items-start">
                              <div>
                                  <h3 className="font-black text-gray-900 text-base">{item.docName}</h3>
                                  <p className="text-[10px] text-gray-900 font-black uppercase tracking-widest mt-1 opacity-50">Share No: {item.shareNo}</p>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-gray-900 tracking-widest">
                                   {item.sharedVia === 'Email' ? <Mail size={12} className="text-blue-600"/> : <MessageCircle size={12} className="text-green-600"/>}
                                   {item.sharedVia}
                              </div>
                         </div>
                         
                         <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                 <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest opacity-40">Recipient</span>
                                 <p className="font-black text-gray-900 text-xs">{item.recipientName}</p>
                             </div>
                             <div className="space-y-1">
                                 <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest opacity-40">Date</span>
                                 <p className="text-gray-900 font-bold text-xs">{formatDate(item.dateTime)}</p>
                             </div>
                         </div>
                         <button className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all">
                             <Download size={16} />
                             View System Copy
                         </button>
                     </div>
                 ))}
             </div>

        </div>
    );
};

export default SharedDocuments;
