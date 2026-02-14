import { useState } from 'react';
import axios from 'axios';
import { Upload, X } from 'lucide-react';
import API_BASE_URL from '../config/api';

const EvidenceUpload = ({ caseId, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError('');
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('caseId', caseId);
        formData.append('description', description);

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            };

            await axios.post(`${API_BASE_URL}/api/evidence`, formData, config);
            setFile(null);
            setDescription('');
            setUploading(false);
            onUploadSuccess();
        } catch (error) {
            console.error('Upload error:', error);
            setError('Failed to upload evidence');
            setUploading(false);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Upload className="mr-2 h-5 w-5 text-blue-500" />
                Upload Evidence
            </h3>

            {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

            <form onSubmit={handleUpload} className="space-y-4">
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                        {file ? (
                            <div className="text-green-400 flex items-center">
                                <span className="truncate max-w-xs">{file.name}</span>
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); setFile(null); }}
                                    className="ml-2 text-gray-400 hover:text-white"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <Upload className="h-8 w-8 text-gray-500 mb-2" />
                                <span className="text-gray-400 text-sm">Click to select file</span>
                            </>
                        )}
                    </label>
                </div>

                <div>
                    <input
                        type="text"
                        placeholder="File Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
                    />
                </div>

                <button
                    type="submit"
                    disabled={uploading || !file}
                    className={`w-full py-2 px-4 rounded font-bold transition-colors ${uploading || !file
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    {uploading ? 'Uploading...' : 'Secure Upload'}
                </button>
            </form>
        </div>
    );
};

export default EvidenceUpload;
