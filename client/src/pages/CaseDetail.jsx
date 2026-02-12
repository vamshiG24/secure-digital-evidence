import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, User, BarChart, X } from 'lucide-react';
import { motion } from 'framer-motion';
import EvidenceUpload from '../components/EvidenceUpload';
import EvidenceList from '../components/EvidenceList';

const CaseDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [caseData, setCaseData] = useState(null);
    const [evidence, setEvidence] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCaseData();
        fetchEvidence();
        markNotificationsAsRead();
    }, [id]);

    const markNotificationsAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`http://localhost:8000/api/notifications/read-by-case/${id}`, {}, config);
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    const fetchCaseData = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get(`http://localhost:8000/api/cases/${id}`, config);
            setCaseData(data);
        } catch (error) {
            console.error('Error fetching case:', error);
        }
    };

    const fetchEvidence = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get(`http://localhost:8000/api/evidence/${id}/list`, config);
            setEvidence(data);
        } catch (error) {
            console.error('Error fetching evidence:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseCase = async () => {
        if (!window.confirm('Are you sure you want to close this case?')) return;
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`http://localhost:8000/api/cases/${id}`, { status: 'Closed' }, config);
            fetchCaseData();
        } catch (error) {
            console.error('Error closing case:', error);
            alert('Failed to close case');
        }
    };

    if (loading || !caseData) return (
        <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Back Button */}
            <Link
                to="/"
                className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition-all hover:translate-x-[-4px]"
            >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Cases</span>
            </Link>

            <div className="space-y-6">
                {/* Case Info Header - Full Width */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border border-gray-800 rounded-2xl p-8 relative overflow-hidden"
                >
                    {/* Background Gradient */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex-1">
                                <h1 className="text-4xl font-bold text-white mb-2">{caseData.title}</h1>
                                <p className="text-gray-400 text-sm font-mono">Case ID: #{caseData._id.slice(-8)}</p>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Status Badge */}
                                <span className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all
                                    ${caseData.status === 'Open' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' :
                                        caseData.status === 'Closed' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                                            'text-blue-400 bg-blue-400/10 border-blue-400/20'}`}>
                                    {caseData.status}
                                </span>

                                {/* Close/Reopen Button - Top Right */}
                                {user?.role === 'admin' && (
                                    caseData.status !== 'Closed' ? (
                                        <button
                                            onClick={handleCloseCase}
                                            className="flex items-center gap-2 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white px-4 py-2 rounded-xl transition-all border border-red-600/20 hover:border-red-600 group"
                                        >
                                            <X className="w-4 h-4" />
                                            <span className="font-semibold">Close Case</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={async () => {
                                                if (!window.confirm('Are you sure you want to reopen this case?')) return;
                                                try {
                                                    const token = localStorage.getItem('token');
                                                    const config = { headers: { Authorization: `Bearer ${token}` } };
                                                    await axios.put(`http://localhost:8000/api/cases/${id}`, { status: 'Open' }, config);
                                                    fetchCaseData();
                                                } catch (error) {
                                                    console.error('Error reopening case:', error);
                                                    alert('Failed to reopen case');
                                                }
                                            }}
                                            className="flex items-center gap-2 bg-green-600/10 hover:bg-green-600 text-green-400 hover:text-white px-4 py-2 rounded-xl transition-all border border-green-600/20 hover:border-green-600 group"
                                        >
                                            <ArrowLeft className="w-4 h-4 rotate-180" />
                                            <span className="font-semibold">Reopen Case</span>
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        <p className="text-gray-300 mb-6 leading-relaxed">{caseData.description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="flex items-center gap-3 bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <BarChart className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Priority</p>
                                    <p className="text-white font-semibold">{caseData.priority}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Clock className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Created</p>
                                    <p className="text-white font-semibold text-sm">{new Date(caseData.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                    <User className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Assigned</p>
                                    <p className="text-white font-semibold text-sm">{caseData.assignedTo?.name || 'Unassigned'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                                <div className="p-2 bg-orange-500/10 rounded-lg">
                                    <User className="w-5 h-5 text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Creator</p>
                                    <p className="text-white font-semibold text-sm">{caseData.createdBy?.name}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Evidence Section - Full Width */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <EvidenceList evidence={evidence} />
                </motion.div>

                {/* Evidence Upload - Full Width (Only for Investigators) */}
                {user?.role === 'investigator' && caseData.status !== 'Closed' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <EvidenceUpload caseId={id} onUploadSuccess={fetchEvidence} />
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default CaseDetail;
