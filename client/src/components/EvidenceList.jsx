import { FileText, Download, Lock } from 'lucide-react';

const EvidenceList = ({ evidence }) => {
    const handleDownload = async (id, fileName) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/evidence/${id}/download`, {
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
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3">Uploader</th>
                            <th className="px-6 py-3">Hash (SHA-256)</th>
                            <th className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {evidence.map((item) => (
                            <tr key={item._id} className="hover:bg-gray-750 transition-colors">
                                <td className="px-6 py-4 flex items-center text-white">
                                    <FileText className="mr-2 h-4 w-4 text-blue-400" />
                                    {item.fileName}
                                </td>
                                <td className="px-6 py-4 text-gray-300 text-sm">{item.description || '-'}</td>
                                <td className="px-6 py-4 text-gray-400 text-sm">{item.uploader?.name}</td>
                                <td className="px-6 py-4">
                                    <span className="font-mono text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded w-32 block truncate" title={item.hash}>
                                        {item.hash}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleDownload(item._id, item.fileName)}
                                        className="text-blue-400 hover:text-blue-300 transition-colors"
                                        title="Download Secure File"
                                    >
                                        <Download className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EvidenceList;
