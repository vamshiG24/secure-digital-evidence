import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Key, Edit, Save, Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({ ...prev, name: user.name, email: user.email }));
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async () => {
        setError(null);
        setMessage(null);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const updateData = {
                name: formData.name,
                email: formData.email
            };

            const { data } = await axios.put(`${API_BASE_URL}/api/users/profile`, updateData, config);
            updateUser(data);
            setMessage('Profile updated successfully!');
            setIsEditing(false);
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Update failed');
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleChangePassword = async () => {
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            await axios.put(`${API_BASE_URL}/api/users/profile`, { password: formData.password }, config);

            setMessage('Password changed successfully!');
            setShowPasswordModal(false);
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Password update failed');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 relative">
            <h1 className="text-3xl font-bold text-white">My Profile</h1>

            {/* Notifications */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg mb-4"
                    >
                        {message}
                    </motion.div>
                )}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="col-span-1 bg-card border border-gray-800 rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-20"></div>

                    <div className="w-24 h-24 rounded-full bg-gray-700 border-4 border-gray-900 flex items-center justify-center text-3xl font-bold text-white mb-4 relative z-10">
                        {user?.name?.charAt(0).toUpperCase()}
                        <button className="absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full hover:bg-blue-500 transition-colors">
                            <Camera className="w-3 h-3 text-white" />
                        </button>
                    </div>

                    <h2 className="text-xl font-bold text-white">{user?.name}</h2>
                    <p className="text-gray-400 capitalize mb-4">{user?.role}</p>

                    <div className="w-full space-y-3">
                        <div className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between">
                            <span className="text-gray-500 text-xs">Status</span>
                            <span className="text-green-400 text-xs font-mono bg-green-400/10 px-2 py-1 rounded">Active</span>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between">
                            <span className="text-gray-500 text-xs">Member Since</span>
                            <span className="text-gray-300 text-xs">Feb 2024</span>
                        </div>
                    </div>
                </motion.div>

                {/* Details Form */}
                <div className="col-span-1 md:col-span-2 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card border border-gray-800 rounded-2xl p-8"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                                <User className="w-5 h-5 text-blue-500" />
                                <span>Personal Information</span>
                            </h3>
                            <button
                                onClick={() => isEditing ? handleUpdateProfile() : setIsEditing(true)}
                                className={`text-sm flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors ${isEditing
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                                    }`}
                            >
                                {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                                <span>{isEditing ? 'Save Changes' : 'Edit'}</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                                    <div className={`flex items-center space-x-3 bg-gray-900/50 border rounded-lg px-4 py-3 ${isEditing ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-gray-700'}`}>
                                        <User className="w-4 h-4 text-gray-500" />
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="bg-transparent text-white w-full focus:outline-none"
                                            />
                                        ) : (
                                            <span className="text-white">{user?.name}</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Email Address</label>
                                    <div className={`flex items-center space-x-3 bg-gray-900/50 border rounded-lg px-4 py-3 ${isEditing ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-gray-700'}`}>
                                        <Mail className="w-4 h-4 text-gray-500" />
                                        {isEditing ? (
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="bg-transparent text-white w-full focus:outline-none"
                                            />
                                        ) : (
                                            <span className="text-white">{user?.email}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Role / Permissions</label>
                                <div className="flex items-center space-x-3 bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 opacity-70">
                                    <Shield className="w-4 h-4 text-gray-500" />
                                    <span className="text-white capitalize">{user?.role}</span>
                                    <span className="text-xs text-gray-500 ml-auto italic">(Managed by Admin)</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card border border-gray-800 rounded-2xl p-8"
                    >
                        <h3 className="text-lg font-bold text-white flex items-center space-x-2 mb-6">
                            <Key className="w-5 h-5 text-yellow-500" />
                            <span>Security</span>
                        </h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">Password</p>
                                <p className="text-sm text-gray-500">Last changed 30 days ago</p>
                            </div>
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors border border-gray-700"
                            >
                                Change Password
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Password Change Modal */}
            <AnimatePresence>
                {showPasswordModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-card border border-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl relative"
                        >
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <h2 className="text-2xl font-bold text-white mb-6">Change Password</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <button
                                    onClick={handleChangePassword}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors mt-4"
                                >
                                    Update Password
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Profile;
