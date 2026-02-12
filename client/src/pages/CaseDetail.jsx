import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, User, BarChart } from 'lucide-react';
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

    if (loading || !caseData) return <div className="text-center mt-10">Loading case details...</div>;

    return (
        <div>
            <Link
                to="/"
                className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Cases</span>
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Case Info - Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                            <h1 className="text-3xl font-bold text-white">{caseData.title}</h1>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold 
                  ${caseData.status === 'Open' ? 'text-yellow-400 bg-yellow-400/10' :
                                    caseData.status === 'Closed' ? 'text-green-400 bg-green-400/10' :
                                        'text-blue-400 bg-blue-400/10'}`}>
                                {caseData.status}
                            </span>
                        </div>
                        <p className="text-gray-300 mb-6 leading-relaxed">{caseData.description}</p>

                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                            <div className="flex items-center">
                                <BarChart className="mr-2 h-4 w-4 text-gray-500" />
                                Priority: <span className="text-white ml-2">{caseData.priority}</span>
                            </div>
                            <div className="flex items-center">
                                <Clock className="mr-2 h-4 w-4 text-gray-500" />
                                Created: <span className="text-white ml-2">{new Date(caseData.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center">
                                <User className="mr-2 h-4 w-4 text-gray-500" />
                                Assigned: <span className="text-white ml-2">{caseData.assignedTo?.name || 'Unassigned'}</span>
                            </div>
                            <div className="flex items-center">
                                <User className="mr-2 h-4 w-4 text-gray-500" />
                                Creator: <span className="text-white ml-2">{caseData.createdBy?.name}</span>
                            </div>
                        </div>
                    </div>

                    <EvidenceList evidence={evidence} />
                </div>

                {/* Sidebar - Right Column */}
                <div className="space-y-8">
                    {/* Hide Upload for Admin OR if Case is Closed */}
                    {user?.role !== 'admin' && caseData.status !== 'Closed' && (
                        <EvidenceUpload caseId={id} onUploadSuccess={fetchEvidence} />
                    )}

                    {/* Show message if closed for investigator */}
                    {user?.role !== 'admin' && caseData.status === 'Closed' && (
                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center text-gray-400">
                            Case is closed. Evidence upload is disabled.
                        </div>
                    )}

                    {/* Admin Actions */}
                    {user?.role === 'admin' && (
                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-4">Admin Actions</h3>

                            {caseData.status !== 'Closed' ? (
                                <button
                                    onClick={async () => {
                                        if (!window.confirm('Are you sure you want to close this case?')) return;
                                        try {
                                            const token = localStorage.getItem('token');
                                            await axios.put(`http://localhost:8000/api/cases/${id}`, { status: 'Closed' }, {
                                                headers: { Authorization: `Bearer ${token}` }
                                            });
                                            fetchCaseData(); // Refresh
                                        } catch (err) {
                                            console.error(err);
                                            alert('Failed to close case');
                                        }
                                    }}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
                                >
                                    Close Case
                                </button>
                            ) : (
                                <button
                                    onClick={async () => {
                                        if (!window.confirm('Are you sure you want to re-open this case?')) return;
                                        try {
                                            const token = localStorage.getItem('token');
                                            await axios.put(`http://localhost:8000/api/cases/${id}`, { status: 'Open' }, {
                                                headers: { Authorization: `Bearer ${token}` }
                                            });
                                            fetchCaseData(); // Refresh
                                        } catch (err) {
                                            console.error(err);
                                            alert('Failed to re-open case');
                                        }
                                    }}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
                                >
                                    Re-open Case
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CaseDetail;
