import { useEffect, useState } from 'react';
import {
    FileText,
    CreditCard,
    CheckCircle,
    RotateCcw,
    X,
    RefreshCw,
    Eye,
    ChevronDown
} from 'lucide-react';
import useDataStore from '../store/dataStore';
import useHeaderStore from '../store/headerStore';
import { useNavigate } from 'react-router-dom';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip
} from 'recharts';
import { formatDate } from '../utils/dateFormatter';
import { documentService } from '../api/documentService';
import { subscriptionService } from '../api/subscriptionService';
import { toast } from 'react-hot-toast';
import PreviewModal from '../components/PreviewModal';

const StatCard = ({ title, value, icon: Icon, color, onClick, bgColor = "bg-white" }: any) => (
    <div
        onClick={onClick}
        className={`${bgColor} p-3 sm:p-4 rounded-2xl shadow-input hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden h-full`}
    >
        <div className="relative z-10 flex justify-between items-start gap-2">
            <div className="flex-1">
                <p className="text-gray-950 text-[10px] sm:text-xs font-bold tracking-wider uppercase">{title}</p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1 sm:mt-1.5 tracking-tight group-hover:text-red-600 transition-colors uppercase">{value}</h3>
            </div>
            <div className={`p-2 rounded-xl ${color} bg-opacity-10 group-hover:bg-opacity-20 transition-all shrink-0`}>
                <Icon size={18} className={color.split(' ')[1] || color.replace('bg-', 'text-')} />
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const { setTitle } = useHeaderStore();
    const { documents, subscriptions, setSubscriptions, setDocuments } = useDataStore();
    const navigate = useNavigate();

    const [selectedStat, setSelectedStat] = useState<{
        type: string,
        title: string,
        data: {
            label: string,
            count: number,
            link: string,
            color?: string,
            bg?: string,
            rawType?: string
        }[]
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Preview & Expansion State
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState<{ files: string[], name: string }>({ files: [], name: '' });

    // Raw data store for accordion view
    const [rawStats, setRawStats] = useState({
        company: [] as any[],
        calibration: [] as any[],
        project: [] as any[],
        compliance: [] as any[],
    });

    const [stats, setStats] = useState({
        company: 0,
        calibration: 0,
        project: 0,
        compliance: 0,
        subscription: 0
    });

    const fetchData = async (showToast = false) => {
        setIsLoading(true);
        try {
            const [companyDocs, calibrationDocs, projectDocs, complianceDocs, allSubs] = await Promise.all([
                documentService.getAll('company_documents'),
                documentService.getAll('calibration_certificate'),
                documentService.getAll('project_approval'),
                documentService.getAll('compliance_documents'),
                subscriptionService.getAll()
            ]);

            setRawStats({
                company: companyDocs,
                calibration: calibrationDocs,
                project: projectDocs,
                compliance: complianceDocs,
            });

            // Update global store so data is available on all devices/sessions
            setSubscriptions(allSubs);
            setDocuments([...companyDocs, ...calibrationDocs, ...projectDocs, ...complianceDocs] as any);

            setStats({
                company: companyDocs.length,
                calibration: calibrationDocs.length,
                project: projectDocs.length,
                compliance: complianceDocs.length,
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
    const totalDocuments = stats.company + stats.calibration + stats.project + stats.compliance;
    const totalSubscriptions = stats.subscription;

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
        setExpandedCategory(null); // Reset expansion when changing tab
        if (type === 'documents') {
            setSelectedStat({
                type: 'documents',
                title: '',
                data: [
                    { label: 'Company Documents', count: stats.company, link: '/document', color: 'text-blue-700', bg: 'bg-blue-50', rawType: 'company' },
                    { label: 'Calibration Certificates', count: stats.calibration, link: '/document', color: 'text-purple-700', bg: 'bg-purple-50', rawType: 'calibration' },
                    { label: 'Project Approvals', count: stats.project, link: '/document', color: 'text-emerald-700', bg: 'bg-emerald-50', rawType: 'project' },
                    { label: 'Compliance Documents', count: stats.compliance, link: '/document', color: 'text-rose-700', bg: 'bg-rose-50', rawType: 'compliance' }
                ]
            });
        } else if (type === 'subscriptions') {
            setSelectedStat({
                type: 'subscriptions',
                title: 'Subscription',
                data: [
                    { label: 'Active (Paid)', count: subscriptions.filter(s => s.status === 'Paid').length, link: '/subscription/all', color: 'text-green-700', bg: 'bg-green-50' },
                    { label: 'Pending Verification', count: subscriptions.filter(s => !s.status || s.status === 'Pending').length, link: '/subscription/approval', color: 'text-amber-700', bg: 'bg-amber-50' },
                    { label: 'Approved & Processing', count: subscriptions.filter(s => s.status === 'Approved').length, link: '/subscription/all', color: 'text-indigo-700', bg: 'bg-indigo-50' }
                ]
            });
        } else if (type === 'renewals') {
            setSelectedStat({
                type: 'renewals',
                title: 'Renewal Requirements',
                data: [
                    { label: 'Overdue (Expired)', count: documents.filter(doc => doc.needsRenewal && new Date(doc.renewalDate!) < new Date()).length, link: '/document/renewal', color: 'text-red-700', bg: 'bg-red-50' },
                    {
                        label: 'Critical (Upcoming)', count: documents.filter(doc => {
                            const today = new Date();
                            const threshold = new Date(today);
                            threshold.setDate(today.getDate() + 30);
                            const d = new Date(doc.renewalDate!);
                            return doc.needsRenewal && d >= today && d <= threshold;
                        }).length, link: '/document/renewal', color: 'text-orange-700', bg: 'bg-orange-50'
                    }
                ]
            });
        } else if (type === 'approvals') {
            setSelectedStat({
                type: 'approvals',
                title: 'Pending Approvals',
                data: [
                    { label: 'New Subscription Requests', count: pendingApprovals, link: '/subscription/approval', color: 'text-cyan-700', bg: 'bg-cyan-50' }
                ]
            });
        }
    };

    const handlePreview = (fileLink: string | null, name: string) => {
        if (!fileLink) {
            toast.error("No file available");
            return;
        }
        const files = fileLink.split(',').filter(f => f.trim() !== '');
        setPreviewData({ files, name });
        setIsPreviewOpen(true);
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

            {/* Breakdown Modal */}
            {selectedStat && (
                <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-fade-in" onClick={() => setSelectedStat(null)}>
                    <div className="bg-white h-full sm:h-auto sm:max-h-[85vh] w-full max-w-2xl overflow-hidden sm:rounded-[2.5rem] shadow-2xl animate-scale-in border border-gray-100 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-black text-gray-950 uppercase text-lg tracking-[0.2em]">
                                {selectedStat.title} {selectedStat.type === 'documents' ? 'Documents' : ''}
                            </h3>
                            <button onClick={() => setSelectedStat(null)} className="p-2 sm:p-3 bg-white hover:bg-red-50 rounded-2xl transition-all text-gray-900 hover:text-red-700 shadow-sm border border-gray-200">
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 sm:p-8 no-scrollbar">
                            {selectedStat.type === 'subscriptions' ? (
                                <div className="space-y-4">
                                    {subscriptions.length > 0 ? subscriptions.map((sub, sIdx) => (
                                        <div key={sIdx} className="bg-white border-2 border-gray-100 hover:border-gray-950 p-5 rounded-3xl transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                                                    <p className="text-[10px] font-black text-gray-950 uppercase tracking-widest leading-none">
                                                        {sub.company_name || sub.companyName}
                                                    </p>
                                                </div>
                                                <h4 className="text-sm sm:text-lg font-black text-gray-950 uppercase tracking-tight leading-tight">
                                                    {sub.service_name || sub.subscriptionName || sub.service || 'Unnamed Service'}
                                                </h4>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                                                <div className="text-left sm:text-right">
                                                    <p className="text-[9px] font-black text-gray-900 uppercase tracking-widest opacity-60">Frequency</p>
                                                    <p className="text-xs font-black text-gray-950 uppercase">{sub.frequency || 'N/A'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-gray-900 uppercase tracking-widest opacity-60">Investment</p>
                                                    <p className="text-base sm:text-lg font-black text-gray-950 tracking-tighter">
                                                        ₹{parseFloat(String(sub.price).replace(/[^\d.]/g, '') || '0').toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest text-center py-20 italic">No Subscription Records Found</p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {selectedStat.data.map((item, idx) => {
                                        const isExpanded = expandedCategory === item.rawType;
                                        const documentsList = item.rawType ? (rawStats as any)[item.rawType] : [];

                                        return (
                                            <div key={idx} className="space-y-2">
                                                <div
                                                    className={`${item.bg || 'bg-gray-50/50'} hover:bg-white border-2 border-transparent hover:border-gray-950 p-4 sm:p-5 rounded-3xl transition-all cursor-pointer group flex items-center justify-between gap-4`}
                                                    onClick={() => {
                                                        if (selectedStat.type === 'documents') {
                                                            setExpandedCategory(isExpanded ? null : item.rawType || null);
                                                        } else {
                                                            setSelectedStat(null);
                                                            navigate(item.link);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex-1">
                                                        <h4 className={`font-black text-sm sm:text-lg ${item.color || 'text-gray-950'} uppercase tracking-tight`}>
                                                            {item.label}
                                                        </h4>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className={`text-2xl sm:text-3xl font-black ${item.color || 'text-gray-900'} tracking-tighter`}>
                                                            {item.count}
                                                        </span>
                                                        <div className={`bg-white p-2 rounded-xl text-gray-950 group-hover:bg-gray-950 group-hover:text-white transition-all ${isExpanded ? 'rotate-180' : ''}`}>
                                                            <ChevronDown size={20} strokeWidth={3} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expanded Sub-List */}
                                                {isExpanded && (
                                                    <div className="pl-4 sm:pl-8 space-y-2 animate-fade-in border-l-4 border-gray-100 ml-5 pt-2 pb-4">
                                                        {documentsList.length > 0 ? documentsList.map((doc: any, dIdx: number) => {
                                                            const docName = doc.instrument_name || doc.document_name || 'Unnamed Record';
                                                            const fileLink = doc.document_view || null;
                                                            return (
                                                                <div key={dIdx} className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all">
                                                                    <p className="text-xs font-black text-gray-950 uppercase tracking-tight truncate flex-1">
                                                                        {docName}
                                                                    </p>
                                                                    <button
                                                                        onClick={() => handlePreview(fileLink, docName)}
                                                                        className="p-2 bg-green-50 hover:bg-green-600 text-green-700 hover:text-white rounded-xl transition-all shadow-sm active:scale-95 border border-green-100"
                                                                        title="View Document"
                                                                    >
                                                                        <Eye size={18} strokeWidth={3} />
                                                                    </button>
                                                                </div>
                                                            );
                                                        }) : (
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-4">No records found in this category</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Resource Overview Section */}
            <div>
                <h2 className="text-md font-black text-gray-900 mb-4 px-1  flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                    Documents & Subscriptions
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
                    <StatCard
                        title="Total Document"
                        value={totalDocuments}
                        icon={FileText}
                        color="bg-blue-600 text-blue-700"
                        onClick={() => handleStatClick('documents')}
                    />
                    <StatCard
                        title="Active Subscriptions"
                        value={totalSubscriptions}
                        icon={CreditCard}
                        color="bg-purple-600 text-purple-700"
                        onClick={() => handleStatClick('subscriptions')}
                    />
                </div>
            </div>

            {/* Operational Metrics */}
            <div>
                <h2 className="text-md font-black text-gray-900 mb-4 px-1 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    Operation Status
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
                    <StatCard
                        title="Renewal Reminders"
                        value={totalRenewals}
                        icon={RotateCcw}
                        color="bg-red-600 text-red-700"
                        onClick={() => handleStatClick('renewals')}
                    />
                    <StatCard
                        title="Pending Requests"
                        value={pendingApprovals}
                        icon={CheckCircle}
                        color="bg-indigo-600 text-indigo-700"
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
                        <h4 className="text-[10px] font-black text-gray-950 uppercase tracking-widest leading-none">Inventory Refreshed</h4>
                        <p className="text-[9px] text-gray-900 mt-2 uppercase font-black tracking-tighter">Database hand-shaking complete</p>
                        <span className="text-[8px] text-red-700 mt-1 block font-black uppercase tracking-widest italic">Live Status</span>
                    </div>
                </div>
            </div>

            <PreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                files={previewData.files}
                documentName={previewData.name}
            />
        </div>
    );
};

export default Dashboard;