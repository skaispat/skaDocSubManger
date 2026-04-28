import { useState, useEffect } from 'react';
import { Search, FileText, Download, Mail, MessageCircle, RefreshCw } from 'lucide-react';
import { shareService, ShareLog } from '../../api/shareService';
import { formatDate } from '../../utils/dateFormatter';
import { toast } from 'react-hot-toast';

const SharedDocuments = ({ navigator }: { navigator?: React.ReactNode }) => {
    const [shareHistory, setShareHistory] = useState<ShareLog[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const data = await shareService.getHistory();
            setShareHistory(data);
        } catch (error) {
            toast.error("Failed to load share history");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const filteredData = shareHistory.filter(item =>
        (String(item.share_no || '')).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (String(item.doc_name || '')).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (String(item.recipient_name || '')).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (String(item.doc_serial || '')).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (String(item.contact_info || '')).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 font-sans">
            {/* Search Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                    <h2 className="text-md font-black text-gray-900 uppercase tracking-tight">Share History</h2>
                    {navigator}
                    {/* <button
                        onClick={fetchHistory}
                        disabled={isLoading}
                        className={`p-2 rounded-xl transition-all ${isLoading ? 'bg-gray-50 text-gray-400' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button> */}
                </div>
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
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div key="loading-desktop" className="flex flex-col items-center justify-center p-40 gap-4">
                        <RefreshCw size={40} className="text-red-600 animate-spin" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Syncing with Supabase...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] uppercase text-gray-900 font-bold tracking-wider">
                                    <th className="px-6 py-4">Share No.</th>
                                    <th className="px-6 py-4">Date & Time</th>
                                    <th className="px-6 py-4">Serial No.</th>
                                    <th className="px-6 py-4">Document Name</th>
                                    <th className="px-6 py-4 text-center">Shared Via</th>
                                    <th className="px-6 py-4">Recipient</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4 text-center">Copy</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-black text-gray-900">{item.share_no}</td>
                                        <td className="px-6 py-4 text-xs text-gray-900 font-bold whitespace-nowrap">
                                            {item.created_at ? formatDate(item.created_at.split('T')[0]) : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-900 font-black tracking-tight">{item.doc_serial}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                                    <FileText size={16} className="text-red-600" />
                                                </div>
                                                <span className="text-sm font-black text-gray-900 truncate max-w-[220px]" title={item.doc_name}>{item.doc_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase text-gray-900 tracking-widest">
                                                {item.shared_via === 'Email' ? <Mail size={14} className="text-blue-600" /> : <MessageCircle size={14} className="text-green-600" />}
                                                {item.shared_via}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-black opacity-60 italic">{item.recipient_name}</td>
                                        <td className="px-6 py-4 text-xs text-gray-900 font-bold whitespace-nowrap opacity-30 tracking-widest">{item.contact_info}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => window.open(item.doc_file, '_blank')}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                title="View Document"
                                            >
                                                <Download size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {!isLoading && filteredData.length === 0 && (
                    <div key="empty-desktop" className="p-20 text-center">
                        <div className="inline-flex p-6 bg-gray-50 rounded-[2rem] mb-4">
                            <FileText size={48} className="text-gray-200" />
                        </div>
                        <p className="text-gray-900 font-black uppercase text-xs tracking-widest opacity-40">No sharing records found in database</p>
                    </div>
                )}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <RefreshCw size={30} className="text-red-600 animate-spin" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Syncing...</p>
                    </div>
                ) : (
                    filteredData.map((item) => (
                        <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-black text-gray-900 text-base">{item.doc_name}</h3>
                                    <p className="text-[10px] text-gray-900 font-black uppercase tracking-widest mt-1 opacity-50">Log No: {item.share_no}</p>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-gray-900 tracking-widest">
                                    {item.shared_via === 'Email' ? <Mail size={12} className="text-blue-600" /> : <MessageCircle size={12} className="text-green-600" />}
                                    {item.shared_via}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest opacity-40">Recipient</span>
                                    <p className="font-black text-gray-900 text-[10px] opacity-60">{item.recipient_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest opacity-40">Date</span>
                                    <p className="text-gray-900 font-bold text-[10px]">
                                        {item.created_at ? formatDate(item.created_at.split('T')[0]) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => window.open(item.doc_file, '_blank')}
                                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all font-sans"
                            >
                                <Download size={16} />
                                View Link
                            </button>
                        </div>
                    ))
                )}
            </div>

        </div>
    );
};

export default SharedDocuments;
