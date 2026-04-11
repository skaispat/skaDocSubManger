import { useEffect, useState } from 'react';
import {
    FileText,
    CreditCard,
    CheckCircle,
    RotateCcw,
    X,
    RefreshCw
} from 'lucide-react';
import useDataStore from '../store/dataStore';
import useHeaderStore from '../store/headerStore';
import { useNavigate } from 'react-router-dom';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    Tooltip
} from 'recharts';
import { formatDate } from '../utils/dateFormatter';
import { documentService } from '../api/documentService';
import { subscriptionService } from '../api/subscriptionService';
import { toast } from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, color, subtext, onClick, bgColor = "bg-white" }: any) => (
    <div
        onClick={onClick}
        className={`${bgColor} p-3 sm:p-4 rounded-2xl shadow-input hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden h-full`}
    >
        <div className="relative z-10 flex justify-between items-start gap-2">
            <div className="flex-1">
                <p className="text-gray-500 text-[10px] sm:text-xs font-bold tracking-wider uppercase">{title}</p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1 sm:mt-1.5 tracking-tight group-hover:text-red-600 transition-colors uppercase">{value}</h3>
                {subtext && <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tighter line-clamp-1">{subtext}</p>}
            </div>
            <div className={`p-2 rounded-xl ${color} bg-opacity-10 group-hover:bg-opacity-20 transition-all shrink-0`}>
                <Icon size={18} className={color.split(' ')[1] || color.replace('bg-', 'text-')} />
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const { setTitle } = useHeaderStore();
    const { documents, subscriptions } = useDataStore();
    const navigate = useNavigate();

    const [selectedStat, setSelectedStat] = useState<{ type: string, title: string, data: { label: string, count: number, link: string }[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Detailed counts for individual categories
    const [stats, setStats] = useState({
        company: 0,
        calibration: 0,
        project: 0,
        subscription: 0
    });

    const fetchData = async (showToast = false) => {
        setIsLoading(true);
        try {
            const [companyDocs, calibrationDocs, projectDocs, allSubs] = await Promise.all([
                documentService.getAll('company_documents'),
                documentService.getAll('calibration_certificate'),
                documentService.getAll('project_approval'),
                subscriptionService.getAll()
            ]);

            setStats({
                company: companyDocs.length,
                calibration: calibrationDocs.length,
                project: projectDocs.length,
                subscription: allSubs.length
            });

            if (showToast) toast.success("Dashboard metrics synchronized");
        } catch (error) {
            console.error("Sync error:", error);
            if (showToast) toast.error("Failed to sync inventory");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setTitle('Overview');
        fetchData();
    }, [setTitle]);

    // Derived counts
    const totalDocuments = stats.company + stats.calibration + stats.project;
    const totalSubscriptions = stats.subscription;

    // Status metrics (fall back to store if needed, but local stats are fresher)
    const totalRenewals = documents.filter(doc => doc.needsRenewal).length;
    const pendingApprovals = subscriptions.filter(sub => !sub.status || sub.status === 'Pending').length;

    const monthlySubscriptionCost = subscriptions.reduce((acc, sub) => {
        let price = parseFloat(String(sub.price).replace(/[^\d.]/g, '')) || 0;
        if (sub.frequency === 'Yearly') price = price / 12;
        if (sub.frequency === 'Quarterly') price = price / 3;
        if (sub.frequency === '6 Months' || sub.frequency === 'Half-Yearly') price = price / 6;
        return acc + price;
    }, 0);

    const handleStatClick = (type: string) => {
        if (type === 'documents') {
            setSelectedStat({
                type: 'documents',
                title: 'Data Inventory Breakdown',
                data: [
                    { label: 'Company Documents', count: stats.company, link: '/document' },
                    { label: 'Calibration Certificates', count: stats.calibration, link: '/document' },
                    { label: 'Project Approvals', count: stats.project, link: '/document' }
                ]
            });
        } else if (type === 'subscriptions') {
            navigate('/subscription/all');
        } else if (type === 'renewals') {
            navigate('/document/renewal');
        } else if (type === 'approvals') {
            navigate('/subscription/approval');
        }
    };

    // --- Chart Data ---
    const subscriptionStatusData = [
        { name: 'Active', value: subscriptions.filter(s => s.status === 'Paid').length, color: '#10B981' },
        { name: 'Pending', value: subscriptions.filter(s => !s.status || s.status === 'Pending').length, color: '#F59E0B' },
        { name: 'Approved', value: subscriptions.filter(s => s.status === 'Approved').length, color: '#991b1b' },
    ].filter(d => d.value > 0);

    const documentStatusData = [
        { name: 'Active', value: totalDocuments - totalRenewals, color: '#991b1b' },
        { name: 'Pending Renewal', value: totalRenewals, color: '#F97316' },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6 pb-6 relative font-sans">

            {/* Sync Indicator */}
            <div className="flex justify-end px-1">
                <button
                    onClick={() => fetchData(true)}
                    disabled={isLoading}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-red-600 transition-colors"
                >
                    <RefreshCw size={12} className={isLoading ? 'animate-spin text-red-600' : ''} />
                    {isLoading ? 'Synchronizing...' : 'Refresh Inventory'}
                </button>
            </div>

            {/* Breakdown Modal */}
            {selectedStat && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setSelectedStat(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-gray-800 uppercase text-sm tracking-widest italic">{selectedStat.title}</h3>
                            <button onClick={() => setSelectedStat(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-0 max-h-[60vh] overflow-y-auto">
                            <div className="divide-y divide-gray-100">
                                {selectedStat.data.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                                        onClick={() => navigate(item.link)}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-700 uppercase text-[11px] tracking-wider">{item.label}</span>
                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter group-hover:text-red-600">Click to view module</span>
                                        </div>
                                        <span className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-black">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-center">
                            <button
                                onClick={() => setSelectedStat(null)}
                                className="w-full py-2 bg-gray-900 text-white text-[10px] font-black rounded-xl hover:bg-red-600 transition-all uppercase tracking-widest shadow-sm"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resource Overview Section */}
            <div>
                <h2 className="text-xs font-black text-gray-900 mb-4 px-1 uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                    Data Center
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
                    <StatCard
                        title="Total Document Files"
                        value={totalDocuments}
                        icon={FileText}
                        color="bg-blue-600 text-blue-700"
                        subtext="Combined Inventory"
                        onClick={() => handleStatClick('documents')}
                    />
                    <StatCard
                        title="Active Subscriptions"
                        value={totalSubscriptions}
                        icon={CreditCard}
                        color="bg-purple-600 text-purple-700"
                        subtext={`Est. ₹${monthlySubscriptionCost.toLocaleString()} Monthly`}
                        onClick={() => handleStatClick('subscriptions')}
                    />
                </div>
            </div>

            {/* Operational Metrics */}
            <div>
                <h2 className="text-xs font-black text-gray-900 mb-4 px-1 uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    Operation Status
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
                    <StatCard
                        title="Renewal Reminders"
                        value={totalRenewals}
                        icon={RotateCcw}
                        color="bg-red-600 text-red-700"
                        subtext="Action required soon"
                        onClick={() => handleStatClick('renewals')}
                    />
                    <StatCard
                        title="Pending Requests"
                        value={pendingApprovals}
                        icon={CheckCircle}
                        color="bg-indigo-600 text-indigo-700"
                        subtext="Awaiting verification"
                        onClick={() => handleStatClick('approvals')}
                    />
                </div>
            </div>

            {/* Chart Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-2xl shadow-input flex flex-col items-center">
                    <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-4 w-full text-center">Software Subscriptions</h3>
                    <div className="h-[140px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={subscriptionStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={5} dataKey="value">
                                    {subscriptionStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <span className="text-xl font-black text-gray-900">{totalSubscriptions}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-input flex flex-col items-center">
                    <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-4 w-full text-center">Compliance Rating</h3>
                    <div className="h-[140px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={documentStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={5} dataKey="value">
                                    {documentStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <span className="text-xl font-black text-gray-900">{totalDocuments}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Log */}
            <div className="bg-white p-5 rounded-2xl shadow-input">
                <h3 className="font-black text-xs text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
                    <RotateCcw size={14} className="text-red-600" />
                    Transaction Log
                </h3>
                <div className="space-y-4 pl-4 border-l-2 border-red-50 ml-1">
                    <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-red-600 shadow-sm border-2 border-white"></div>
                        <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Inventory Refreshed</h4>
                        <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-tight">Database hand-shaking complete</p>
                        <span className="text-[8px] text-red-400 mt-1 block font-black uppercase tracking-widest italic">Live Status</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;