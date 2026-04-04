import { FileText, Download, Lock, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, RefreshCw, Bug } from 'lucide-react';
import React, { useState } from 'react';
import API_BASE_URL from '../config/api';

const EvidenceList = ({ evidence }) => {
    const [expandedRow, setExpandedRow] = useState(null);
    const [verificationStatus, setVerificationStatus] = useState({});

    const handleVerify = async (id) => {
        setVerificationStatus(prev => ({ ...prev, [id]: { status: 'loading' } }));
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/evidence/${id}/verify`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (response.ok) {
                setVerificationStatus(prev => ({ 
                    ...prev, 
                    [id]: { 
                        status: data.verified ? 'verified' : 'tampered',
                        message: data.message
                    } 
                }));
            } else {
                setVerificationStatus(prev => ({ 
                    ...prev, 
                    [id]: { status: 'error', message: data.message || 'Verification failed' } 
                }));
            }
        } catch (error) {
            setVerificationStatus(prev => ({ 
                ...prev, 
                [id]: { status: 'error', message: 'Network error during verification' } 
            }));
        }
    };

    const handleSimulateTamper = async (id) => {
        if (!window.confirm("Simulate tampering? This will irrevocably alter the stored hash for this file.")) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/evidence/${id}/simulate-tamper`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (response.ok) {
                alert(data.message);
                // Clear any existing verification status for this so user has to re-verify
                setVerificationStatus(prev => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
            } else {
                alert('Simulation failed: ' + data.message);
            }
        } catch (error) {
            console.error('Tamper simulation error:', error);
            alert('Failed to simulate tampering');
        }
    };

    const handleDownload = async (id, fileName) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/evidence/${id}/download`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            } else {
                alert('Download failed');
            }
        } catch (error) {
            console.error('Download error:', error);
        }
    };

    const toggleRow = (id) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    if (evidence.length === 0) {
        return <div className="text-gray-500 text-center py-4 bg-gray-800 rounded-lg border border-gray-700">No evidence uploaded yet.</div>;
    }

    return (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="bg-gray-900/50 px-6 py-4 border-b border-gray-700">
                <h3 className="text-lg font-bold text-white flex items-center">
                    <Lock className="mr-2 h-5 w-5 text-green-500" />
                    Secured Digital Evidence
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-900/50 text-gray-400 uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-6 py-3">File Name</th>
                            <th className="px-6 py-3">Case ID</th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3">Uploader</th>
                            <th className="px-6 py-3">Uploaded At</th>
                            <th className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {evidence.map((item) => (
                            <React.Fragment key={item._id}>
                                <tr className="hover:bg-gray-750 transition-colors">
                                    <td className="px-6 py-4 flex items-center text-white">
                                        <FileText className="mr-2 h-4 w-4 text-blue-400" />
                                        <span className="truncate max-w-xs" title={item.fileName}>
                                            {item.fileName}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
                                            #{item.caseId?.toString().slice(-6) || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300 text-sm">
                                        {item.description ? (
                                            <button
                                                onClick={() => toggleRow(item._id)}
                                                className="flex items-center gap-2 hover:text-blue-400 transition-colors"
                                            >
                                                <span className="truncate max-w-[200px]">
                                                    {item.description}
                                                </span>
                                                {expandedRow === item._id ? (
                                                    <ChevronUp className="w-4 h-4 flex-shrink-0" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                                                )}
                                            </button>
                                        ) : (
                                            <span className="text-gray-500">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-sm">{item.uploader?.name}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-300">
                                            {new Date(item.uploadedAt).toLocaleString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex gap-4 items-center">
                                        <button
                                            onClick={() => handleDownload(item._id, item.fileName)}
                                            className="text-blue-400 hover:text-blue-300 transition-colors"
                                            title="Download Secure File"
                                        >
                                            <Download className="h-5 w-5" />
                                        </button>

                                        <button
                                            onClick={() => handleVerify(item._id)}
                                            disabled={verificationStatus[item._id]?.status === 'loading'}
                                            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50 relative group"
                                            title="Verify File Integrity"
                                        >
                                            {verificationStatus[item._id]?.status === 'loading' ? (
                                                <RefreshCw className="h-5 w-5 animate-spin text-blue-400" />
                                            ) : verificationStatus[item._id]?.status === 'verified' ? (
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            ) : verificationStatus[item._id]?.status === 'tampered' ? (
                                                <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                                            ) : (
                                                <CheckCircle className="h-5 w-5" />
                                            )}
                                        </button>

                                        {/* Simulate Tamper Button - Only for Student Project Demo */}
                                        <button
                                            onClick={() => handleSimulateTamper(item._id)}
                                            className="text-red-900 hover:text-red-500 transition-colors"
                                            title="Simulate Tampering (Demo purposes)"
                                        >
                                            <Bug className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                                {/* Expanded Description Row with Smooth Animation */}
                                <tr
                                    key={`${item._id}-expanded`}
                                    className={`bg-gray-900/30 transition-all duration-300 ease-in-out ${expandedRow === item._id ? 'opacity-100' : 'opacity-0 h-0'
                                        }`}
                                >
                                    <td colSpan="6" className="px-6 overflow-hidden">
                                        <div
                                            className={`transition-all duration-300 ease-in-out ${expandedRow === item._id
                                                ? 'max-h-96 py-4 opacity-100'
                                                : 'max-h-0 py-0 opacity-0'
                                                }`}
                                        >
                                            {item.description && (
                                                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                                                    <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Full Description</p>
                                                    <p className="text-gray-300 text-sm leading-relaxed">
                                                        {item.description}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EvidenceList;
