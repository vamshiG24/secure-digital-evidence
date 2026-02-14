import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, FolderOpen, AlertTriangle, CheckCircle, TrendingUp, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
// import AISearchBar from '../components/AISearchBar'; // REMOVED

// const [aiSearchResults, setAiSearchResults] = useState(null); // REMOVED

/* REMOVED AI SEARCH HANDLER
const handleAISearchResults = (results) => {
    setAiSearchResults(results);
};
*/

// In render:
{/* <AISearchBar onResults={handleAISearchResults} /> // REMOVED */ }
import API_BASE_URL from '../config/api';

const Dashboard = () => {
    const [cases, setCases] = useState([]);
    const [filteredCases, setFilteredCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'all');
    const [isAISearch, setIsAISearch] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        open: 0,
        inProgress: 0,
        closed: 0
    });
    const [unreadCaseIds, setUnreadCaseIds] = useState(new Set());
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await Promise.all([
                fetchCases(),
                fetchUnreadNotifications()
            ]);
            setLoading(false);
        };
        fetchData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [cases, searchQuery, statusFilter, priorityFilter]);

    const calculateStats = (casesData) => {
        const total = casesData.length;
        const open = casesData.filter(c => c.status === 'Open').length;
        const inProgress = casesData.filter(c => c.status === 'In Progress').length;
        const closed = casesData.filter(c => c.status === 'Closed').length;
        setStats({ total, open, inProgress, closed });
    };

    const fetchCases = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get(`${API_BASE_URL}/api/cases`, config);
            setCases(data);
            calculateStats(data);
        } catch (error) {
            console.error('Error fetching cases:', error);
        }
    };

    const fetchUnreadNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get(`${API_BASE_URL}/api/notifications`, config);

            const ids = new Set();
            data.forEach(notif => {
                if (!notif.isRead && notif.relatedLink && notif.relatedLink.startsWith('/cases/')) {
                    const caseId = notif.relatedLink.split('/cases/')[1];
                    ids.add(caseId);
                }
            });
            setUnreadCaseIds(ids);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const applyFilters = () => {
        let filtered = [...cases];

        // Search by case ID or title
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c._id.toLowerCase().includes(query) ||
                c.title.toLowerCase().includes(query)
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(c => c.status === statusFilter);
        }

        // Filter by priority
        if (priorityFilter !== 'all') {
            filtered = filtered.filter(c => c.priority === priorityFilter);
        }

        setFilteredCases(filtered);
    };

    const handleStatusFilterClick = (status) => {
        const newStatus = statusFilter === status ? 'all' : status;
        setStatusFilter(newStatus);
        updateURLParams({ status: newStatus });
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setPriorityFilter('all');
        setSearchParams({});
    };

    const updateURLParams = (updates) => {
        const params = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => {
            if (value && value !== 'all') {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });
        setSearchParams(params);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'In Progress': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'Closed': return 'text-green-400 bg-green-400/10 border-green-400/20';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Critical': return 'text-red-500';
            case 'High': return 'text-orange-500';
            case 'Medium': return 'text-yellow-500';
            case 'Low': return 'text-blue-500';
            default: return 'text-gray-500';
        }
    };

    const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + 'y ago';

        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + 'mo ago';

        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + 'd ago';

        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + 'h ago';

        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + 'm ago';

        return 'Just now';
    };

    const getActivityColor = (status) => {
        switch (status) {
            case 'Open': return 'bg-yellow-400 shadow-yellow-400/50';
            case 'In Progress': return 'bg-blue-400 shadow-blue-400/50';
            case 'Closed': return 'bg-green-400 shadow-green-400/50';
            default: return 'bg-gray-400 shadow-gray-400/50';
        }
    };

    const handleAISearchResults = (results) => {
        setFilteredCases(results);
        setIsAISearch(true);
        // Clear manual filters when using AI search
        setSearchQuery('');
        setStatusFilter('all');
        setPriorityFilter('all');
    };

    const hasActiveFilters = searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || isAISearch;

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );

    // Analyst View - Simple Cases List with Search Only
    if (user?.role === 'analyst') {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Cases</h1>
                    <p className="text-gray-400">View and search all cases</p>
                </div>

                {/* Search and Filters */}
                <div className="bg-card border border-gray-800 rounded-2xl p-6 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search by Case ID or Title..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        updateURLParams({ search: e.target.value });
                                    }}
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                updateURLParams({ status: e.target.value });
                            }}
                            className="bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        >
                            <option value="all">All Status</option>
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Closed">Closed</option>
                        </select>

                        {/* Priority Filter */}
                        <select
                            value={priorityFilter}
                            onChange={(e) => {
                                setPriorityFilter(e.target.value);
                                updateURLParams({ priority: e.target.value });
                            }}
                            className="bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        >
                            <option value="all">All Priority</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <button
                                onClick={handleClearFilters}
                                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-3 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                                <span>Clear</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Cases List */}
                <div className="bg-card border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-gray-800">
                        <h2 className="text-xl font-bold text-white">
                            All Cases {searchQuery && `(${filteredCases.length} results)`}
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        {filteredCases.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                {searchQuery ? 'No cases match your search' : 'No cases found'}
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Case</th>
                                        <th className="px-6 py-3 text-left">Case ID</th>
                                        <th className="px-6 py-3 text-left">Status</th>
                                        <th className="px-6 py-3 text-left">Priority</th>
                                        <th className="px-6 py-3 text-left">Assigned</th>
                                        <th className="px-6 py-3 text-left">Created By</th>
                                        <th className="px-6 py-3 text-left">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {filteredCases.map((caseItem) => (
                                        <tr
                                            key={caseItem._id}
                                            onClick={() => navigate(`/cases/${caseItem._id}`)}
                                            className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-1">
                                                        <p className="text-white font-medium">{caseItem.title}</p>
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{caseItem.description}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
                                                    #{caseItem._id.slice(-8)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(caseItem.status)}`}>
                                                    {caseItem.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(caseItem.priority)}`}>
                                                    {caseItem.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 text-sm">
                                                {caseItem.assignedTo?.name || 'Unassigned'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 text-sm">
                                                {caseItem.createdBy?.name || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 text-sm">
                                                {new Date(caseItem.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    }

    // Admin & Investigator View - Full Dashboard
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                    <p className="text-gray-400 mt-1">Welcome back, {user?.name}</p>
                </div>
                {user?.role === 'admin' && (
                    <Link
                        to="/create-case"
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-900/30"
                    >
                        <Plus className="w-5 h-5" />
                        <span>New Case</span>
                    </Link>
                )}
            </div>

            {/* Stats Cards - Now Clickable */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Cases', value: stats.total, icon: FolderOpen, color: 'text-blue-500', bg: 'bg-blue-500/10', status: 'all' },
                    { label: 'Active Investigations', value: stats.open + stats.inProgress, icon: TrendingUp, color: 'text-yellow-500', bg: 'bg-yellow-500/10', status: 'Open' },
                    { label: 'Cases Closed', value: stats.closed, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', status: 'Closed' },
                    { label: 'Pending Review', value: stats.open, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10', status: 'Open' },
                ].map((stat, index) => {
                    const Icon = stat.icon;
                    const isActive = statusFilter === stat.status || (stat.status === 'all' && statusFilter === 'all');
                    return (
                        <motion.button
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => handleStatusFilterClick(stat.status)}
                            className={`bg-card border ${isActive ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-800'} p-6 rounded-2xl hover:border-gray-700 transition-all relative overflow-hidden group cursor-pointer text-left`}
                        >
                            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 ${stat.bg} rounded-xl`}>
                                        <Icon className={`w-6 h-6 ${stat.color}`} />
                                    </div>
                                    {isActive && (
                                        <span className="text-xs text-blue-400 font-semibold">ACTIVE</span>
                                    )}
                                </div>
                                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                                <p className="text-sm text-gray-400">{stat.label}</p>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* AI Smart Search - REMOVED */}
            {/* 
            <div className="bg-card border border-gray-800 rounded-2xl p-6 mb-6">
                <h2 className="text-lg font-bold text-white mb-4">🤖 AI-Powered Search</h2>
                <AISearchBar onResults={handleAISearchResults} />
            </div> 
            */}

            {/* Manual Search and Filters */}
            <div className="bg-card border border-gray-800 rounded-2xl p-6">
                <h3 className="text-sm font-medium text-gray-400 mb-4">Or use manual filters:</h3>
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search by Case ID or Title..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setIsAISearch(false);
                                    updateURLParams({ search: e.target.value });
                                }}
                                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            updateURLParams({ status: e.target.value });
                        }}
                        className="bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    >
                        <option value="all">All Status</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Closed">Closed</option>
                    </select>

                    {/* Priority Filter */}
                    <select
                        value={priorityFilter}
                        onChange={(e) => {
                            setPriorityFilter(e.target.value);
                            updateURLParams({ priority: e.target.value });
                        }}
                        className="bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    >
                        <option value="all">All Priority</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <button
                            onClick={handleClearFilters}
                            className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-3 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                            <span>Clear</span>
                        </button>
                    )}
                </div>

                {/* Filter Results Info */}
                {hasActiveFilters && (
                    <div className="mt-4 text-sm text-gray-400">
                        Showing <span className="text-white font-semibold">{filteredCases.length}</span> of <span className="text-white font-semibold">{cases.length}</span> cases
                    </div>
                )}
            </div>

            {/* Cases Grid and Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Cases List */}
                <div className="lg:col-span-3 bg-card border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-gray-800">
                        <h2 className="text-xl font-bold text-white">Recent Cases</h2>
                    </div>
                    <div className="overflow-x-auto">
                        {filteredCases.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                {hasActiveFilters ? 'No cases match your filters' : 'No cases found'}
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Case</th>
                                        <th className="px-6 py-3 text-left">Case ID</th>
                                        <th className="px-6 py-3 text-left">Status</th>
                                        <th className="px-6 py-3 text-left">Priority</th>
                                        <th className="px-6 py-3 text-left">Assigned</th>
                                        <th className="px-6 py-3 text-left">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {filteredCases.slice(0, 10).map((caseItem) => (
                                        <tr
                                            key={caseItem._id}
                                            onClick={() => navigate(`/cases/${caseItem._id}`)}
                                            className="hover:bg-gray-800/50 transition-colors cursor-pointer relative"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-1">
                                                        <p className="text-white font-medium">{caseItem.title}</p>
                                                        <p className="text-xs text-gray-500 font-mono">#{caseItem._id.slice(-6)}</p>
                                                    </div>
                                                    {unreadCaseIds.has(caseItem._id) && (
                                                        <span className="flex h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
                                                    #{caseItem._id.slice(-8)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(caseItem.status)}`}>
                                                    {caseItem.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-semibold ${getPriorityColor(caseItem.priority)}`}>
                                                    {caseItem.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 text-sm">
                                                {caseItem.assignedTo?.name || 'Unassigned'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 text-sm">
                                                {new Date(caseItem.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Recent Activity Timeline */}
                <div className="bg-card border border-gray-800 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        {filteredCases.slice(0, 8).map((caseItem, index) => {
                            const timeAgo = getTimeAgo(caseItem.createdAt);
                            const statusColor = getActivityColor(caseItem.status);

                            return (
                                <motion.div
                                    key={caseItem._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-800/30 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/cases/${caseItem._id}`)}
                                >
                                    <div className={`w-2 h-2 rounded-full mt-2 ${statusColor} shadow-lg`}></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {caseItem.title}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {caseItem.status === 'Open' && 'Case opened'}
                                                    {caseItem.status === 'In Progress' && 'Investigation ongoing'}
                                                    {caseItem.status === 'Closed' && 'Case closed'}
                                                    {caseItem.assignedTo && ` • Assigned to ${caseItem.assignedTo.name}`}
                                                </p>
                                            </div>
                                            <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                                                {caseItem.status}
                                            </span>
                                            <span className={`text-xs font-medium ${getPriorityColor(caseItem.priority)}`}>
                                                {caseItem.priority}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {filteredCases.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <p>No recent activity</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
