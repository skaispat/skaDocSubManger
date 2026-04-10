import { useState, useEffect } from 'react';
import { Plus, Search, Banknote, Calendar, DollarSign, Building, FileText } from 'lucide-react';
import useDataStore from '../../store/dataStore';
import useHeaderStore from '../../store/headerStore';
import AddLoan from './AddLoan';

const AllLoans = () => {
  const { setTitle } = useHeaderStore();
  const { loans } = useDataStore();

  useEffect(() => {
    setTitle('All Loans');
  }, [setTitle]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBank, setFilterBank] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredData = loans.filter(item => {
    const matchesSearch = item.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.loanName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBank = filterBank ? item.bankName === filterBank : true;

    return matchesSearch && matchesBank;
  });

  return (
    <>
      <div className="space-y-3">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-white p-3 rounded-xl shadow-input">
          <div className="min-h-[32px] flex items-center">
            <h1 className="text-xl font-bold text-gray-800">All Loans</h1>
          </div>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search loans..."
                className="pl-9 pr-4 py-2 w-full shadow-input border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={filterBank}
                onChange={(e) => setFilterBank(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 shadow-input border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 text-gray-700 text-xs font-medium cursor-pointer hover:bg-gray-100 transition-colors w-full sm:w-auto"
              >
                <option value="">All Banks</option>
                {Array.from(new Set(loans.map(l => l.bankName))).filter(Boolean).sort().map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
              </div>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-all shadow-md whitespace-nowrap text-sm"
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
                <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                  <th className="px-3 py-2 bg-gray-50">Serial No.</th>
                  <th className="px-3 py-2 bg-gray-50">Loan Name</th>
                  <th className="px-3 py-2 bg-gray-50">Bank Name</th>
                  <th className="px-3 py-2 bg-gray-50">Amount</th>
                  <th className="px-3 py-2 bg-gray-50">EMI</th>
                  <th className="px-3 py-2 bg-gray-50">Start Date</th>
                  <th className="px-3 py-2 bg-gray-50">End Date</th>
                  <th className="px-3 py-2 bg-gray-50">Provided Document</th>
                  <th className="px-3 py-2 bg-gray-50">File</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-3 py-1.5 font-medium text-gray-900">{item.sn}</td>
                    <td className="px-3 py-1.5 font-medium text-gray-900">{item.loanName}</td>
                    <td className="px-3 py-1.5 text-gray-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Building size={14} className="text-red-600" />
                        {item.bankName}
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-gray-900 font-medium">{item.amount}</td>
                    <td className="px-3 py-1.5 text-gray-600">{item.emi}</td>
                    <td className="px-3 py-1.5 text-gray-600 whitespace-nowrap">{item.startDate}</td>
                    <td className="px-3 py-1.5 text-gray-600 whitespace-nowrap">{item.endDate}</td>
                    <td className="px-3 py-1.5 text-gray-600 truncate max-w-[150px]">{item.providedDocument}</td>
                    <td className="px-3 py-1.5">
                      {item.file ? (
                        <a href={item.fileContent || '#'} download={item.file} className="flex items-center gap-1 text-red-600 hover:text-red-800" title={item.file}>
                          <FileText size={16} />
                          <span className="text-xs">View</span>
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden grid grid-cols-1 gap-3">
          {filteredData.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-input">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                    <Building size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{item.loanName}</h3>
                    <p className="text-[10px] text-gray-500">{item.bankName} • {item.sn}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 border border-red-100">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                <div className="space-y-0.5">
                  <p className="text-gray-500">Amount</p>
                  <p className="font-semibold text-gray-900">{item.amount}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-gray-500">EMI</p>
                  <p className="font-semibold text-gray-900">{item.emi}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-gray-500">Start Date</p>
                  <p className="font-medium text-gray-900">{item.startDate}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-gray-500">End Date</p>
                  <p className="font-medium text-gray-900">{item.endDate}</p>
                </div>
              </div>

              {item.file && (
                <div className="mt-3 pt-2 border-t border-gray-50 flex justify-end">
                  <a href={item.fileContent || '#'} download={item.file} className="flex items-center gap-1.5 text-red-600 text-xs font-semibold">
                    <FileText size={14} />
                    Download PDF
                  </a>
                </div>
              )}
            </div>
          ))}
          {filteredData.length === 0 && (
            <div className="text-center p-8 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
              <p className="text-sm">No loans found</p>
            </div>
          )}
        </div>
      </div>
      <AddLoan isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </>
  );
};

export default AllLoans;
