import { useState, useEffect } from 'react';
import { Search, Database, Layers, Tag, Building2, Plus } from 'lucide-react';
import useHeaderStore from '../../store/headerStore';
import useDataStore from '../../store/dataStore';
import AddMaster from './AddMaster';

const MasterPage = () => {
    const { setTitle } = useHeaderStore();
    const { masterData } = useDataStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        setTitle('Master Data');
    }, [setTitle]);

    const dataToDisplay = masterData || [];

    const filteredData = dataToDisplay.filter(item =>
        (item.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.documentType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
        <div className="space-y-4 pb-12">
            {/* Unified Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-white p-3 rounded-xl shadow-input">
                <div className="min-h-[32px] flex items-center">
                    <h1 className="text-xl font-bold text-gray-900">Master Data</h1>
                </div>
                <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 items-center">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search records..."
                            className="pl-9 pr-4 py-2 w-full shadow-input border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                     <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all shadow-md text-sm font-medium"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add New</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-input overflow-hidden h-[calc(100vh-220px)] flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
                            <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                <th className="px-4 py-2.5 bg-gray-50">Company Name</th>
                                <th className="px-4 py-2.5 bg-gray-50">Document Type</th>
                                <th className="px-4 py-2.5 bg-gray-50">Category</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-50">
                            {filteredData.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="px-4 py-2 text-gray-900 flex items-center gap-2">
                                        <div className="p-1.5 bg-red-50 text-red-600 rounded-lg shrink-0">
                                            <Building2 size={16} />
                                        </div>
                                        <span className="font-semibold">{item.companyName}</span>
                                    </td>
                                    <td className="px-4 py-2 text-gray-600">
                                         <div className="flex items-center gap-1.5">
                                            <Layers size={14} className="text-gray-400" />
                                            {item.documentType}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-gray-600">
                                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-600 border border-gray-100 rounded text-[10px] font-bold uppercase tracking-wider">
                                            <Tag size={12} />
                                            {item.category}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Database size={40} className="text-gray-200" />
                                            <p className="text-sm">No records found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <AddMaster isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
        </>
    );
};

export default MasterPage;
