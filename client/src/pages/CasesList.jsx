import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Plus, ChevronRight, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const CasesList = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'all');
    const navigate = useNavigate();

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('http://localhost:8000/api/cases', config);
            setCases(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching cases:', error);
            setLoading(false);
        }
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

    const filteredCases = cases.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c._id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    if (loading) return (
        <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Case Management</h1>
                    <p className="text-gray-400 mt-1">View, manage, and track all digital investigation cases</p>
                </div>
                <Link
                    to="/create-case"
                    className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-900/30"
                >
                    <Plus className="w-5 h-5" />
                    <span>New Case</span>
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-card border border-gray-800 rounded-2xl p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search cases..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex gap-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        >
                            <option value="all">All Status</option>
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Closed">Closed</option>
                        </select>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        >
                            <option value="all">All Priority</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Cases Table */}
            <div className="bg-card border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-900/50 text-gray-400 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">Case Details</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Priority</th>
                                <th className="px-6 py-4">Assigned To</th>
                                <th className="px-6 py-4">Created Date</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {filteredCases.map((caseItem) => (
                                <tr
                                    key={caseItem._id}
                                    className="hover:bg-gray-800/50 transition-colors group cursor-pointer"
                                    onClick={() => navigate(`/cases/${caseItem._id}`)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-start flex-col">
                                            <span className="text-white font-medium text-lg">{caseItem.title}</span>
                                            <span className="text-gray-500 text-xs font-mono mt-1">ID: {caseItem._id}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(caseItem.status)}`}>
                                            {caseItem.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <span className={`h-2.5 w-2.5 rounded-full ${caseItem.priority === 'Critical' ? 'bg-red-500 shadow-red-500/50 shadow-sm' :
                                                    caseItem.priority === 'High' ? 'bg-orange-500' :
                                                        caseItem.priority === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                                }`}></span>
                                            <span className={`text-sm font-medium ${getPriorityColor(caseItem.priority)}`}>
                                                {caseItem.priority}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {caseItem.assignedTo ? (
                                            <div className="flex items-center space-x-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white">
                                                    {caseItem.assignedTo.name.charAt(0)}
                                                </div>
                                                <span className="text-gray-300 text-sm">{caseItem.assignedTo.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-500 text-sm italic">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-sm">
                                        {new Date(caseItem.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transition-colors inline-block" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredCases.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No cases found matching your filters.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CasesList;
