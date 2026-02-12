import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Logs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('http://localhost:8000/api/logs', config);
            setLogs(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching logs:', error);
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center mt-10">Loading logs...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
            </button>

            <div className="flex items-center mb-8">
                <ShieldAlert className="h-8 w-8 text-blue-500 mr-3" />
                <h1 className="text-3xl font-bold text-white">System Audit Logs</h1>
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-900/50 text-gray-400 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4">IP Address</th>
                                <th className="px-6 py-4">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {logs.map((log) => (
                                <tr key={log._id} className="hover:bg-gray-750 transition-colors">
                                    <td className="px-6 py-4 text-white font-medium">
                                        {log.user ? log.user.name : 'System/Unknown'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-xs">
                                        {log.user?.role?.toUpperCase() || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-blue-400 text-sm">
                                        {log.action}
                                    </td>
                                    <td className="px-6 py-4 text-gray-300 text-sm max-w-xs truncate" title={JSON.stringify(log.details)}>
                                        {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs font-mono">
                                        {log.ipAddress}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-xs">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {logs.length === 0 && (
                        <div className="p-8 text-center text-gray-500">No logs found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Logs;
