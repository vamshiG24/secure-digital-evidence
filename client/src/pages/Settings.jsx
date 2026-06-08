import { useState } from 'react';
import { Bell, Shield, Lock, Monitor, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const Settings = () => {
    const { user, updateUser } = useAuth();
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [pushNotifs, setPushNotifs] = useState(false);

    // 2FA Dialog States
    const [mfaModal, setMfaModal] = useState(null); // 'enable' | 'disable' | null
    const [otpCode, setOtpCode] = useState('');
    const [disablePassword, setDisablePassword] = useState('');
    const [mfaLoading, setMfaLoading] = useState(false);
    const [mfaError, setMfaError] = useState('');
    const [mfaSuccess, setMfaSuccess] = useState('');

    const handleOpenEnable2FA = async () => {
        setMfaError('');
        setMfaSuccess('');
        setOtpCode('');
        setMfaLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            // Call API to send OTP code to email
            await axios.post(API_ENDPOINTS.REQUEST_ENABLE_2FA, {}, config);
            
            setMfaModal('enable');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to send verification code. Please try again.');
        } finally {
            setMfaLoading(false);
        }
    };

    const handleConfirmEnable2FA = async (e) => {
        e.preventDefault();
        setMfaError('');
        setMfaLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            // Confirm OTP and enable 2FA
            const { data } = await axios.post(API_ENDPOINTS.CONFIRM_ENABLE_2FA, { otp: otpCode }, config);
            
            // Update local auth context user object
            updateUser({
                ...user,
                twoFactorEnabled: true
            });
            
            setMfaSuccess('Two-Factor Authentication enabled successfully!');
            setTimeout(() => {
                setMfaModal(null);
            }, 2000);
        } catch (error) {
            setMfaError(error.response?.data?.message || 'Invalid or expired code.');
        } finally {
            setMfaLoading(false);
        }
    };

    const handleConfirmDisable2FA = async (e) => {
        e.preventDefault();
        setMfaError('');
        setMfaLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            // Confirm password and disable 2FA
            await axios.post(API_ENDPOINTS.DISABLE_2FA, { password: disablePassword }, config);
            
            // Update local auth context user object
            updateUser({
                ...user,
                twoFactorEnabled: false
            });
            
            setMfaSuccess('Two-Factor Authentication disabled successfully.');
            setTimeout(() => {
                setMfaModal(null);
            }, 2000);
        } catch (error) {
            setMfaError(error.response?.data?.message || 'Incorrect password.');
        } finally {
            setMfaLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-white">Settings</h1>

            <div className="space-y-6">
                {/* Appearance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-gray-800 rounded-2xl p-6"
                >
                    <div className="flex items-center space-x-3 mb-6">
                        <Monitor className="w-6 h-6 text-blue-500" />
                        <h2 className="text-xl font-bold text-white">Appearance</h2>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-gray-800 last:border-0">
                        <div>
                            <p className="text-white font-medium">Theme</p>
                            <p className="text-sm text-gray-500">Customize the application look</p>
                        </div>
                        <div className="flex items-center space-x-2 bg-gray-900 p-1 rounded-lg border border-gray-700">
                            <button className="px-3 py-1.5 rounded-md bg-gray-800 text-white shadow-sm text-sm">Dark</button>
                            <button className="px-3 py-1.5 rounded-md text-gray-500 hover:text-white text-sm">Light</button>
                        </div>
                    </div>
                </motion.div>

                {/* Notifications */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border border-gray-800 rounded-2xl p-6"
                >
                    <div className="flex items-center space-x-3 mb-6">
                        <Bell className="w-6 h-6 text-yellow-500" />
                        <h2 className="text-xl font-bold text-white">Notifications</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-white font-medium">Email Notifications</p>
                                <p className="text-sm text-gray-500">Receive updates about your cases via email</p>
                            </div>
                            <button
                                onClick={() => setEmailNotifs(!emailNotifs)}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${emailNotifs ? 'bg-blue-600' : 'bg-gray-700'}`}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${emailNotifs ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-white font-medium">Push Notifications</p>
                                <p className="text-sm text-gray-500">Receive real-time alerts in the browser</p>
                            </div>
                            <button
                                onClick={() => setPushNotifs(!pushNotifs)}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${pushNotifs ? 'bg-blue-600' : 'bg-gray-700'}`}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${pushNotifs ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Account Security */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card border border-gray-800 rounded-2xl p-6"
                >
                    <div className="flex items-center space-x-3 mb-6">
                        <Shield className="w-6 h-6 text-green-500" />
                        <h2 className="text-xl font-bold text-white">Privacy & Security</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-white font-medium">Two-Factor Authentication (2FA)</p>
                                <p className="text-sm text-gray-500">
                                    {user?.twoFactorEnabled 
                                        ? 'Your account is secured with email one-time passwords.' 
                                        : 'Add an extra layer of security to your account using email verification.'}
                                </p>
                            </div>
                            {user?.twoFactorEnabled ? (
                                <button
                                    onClick={() => {
                                        setMfaError('');
                                        setMfaSuccess('');
                                        setDisablePassword('');
                                        setMfaModal('disable');
                                    }}
                                    className="px-4 py-2 border border-red-600 text-red-500 hover:bg-red-600 hover:text-white rounded-lg text-sm transition-colors"
                                >
                                    Disable 2FA
                                </button>
                            ) : (
                                <button
                                    onClick={handleOpenEnable2FA}
                                    disabled={mfaLoading}
                                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-500 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                                >
                                    {mfaLoading ? 'Sending...' : 'Enable 2FA'}
                                </button>
                            )}
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-white font-medium">Session History</p>
                                <p className="text-sm text-gray-500">Manage your active sessions and devices</p>
                            </div>
                            <button className="text-gray-400 hover:text-white text-sm underline">
                                View Sessions
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Modal Dialog for Enabling / Disabling 2FA */}
            <AnimatePresence>
                {mfaModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-card border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden relative p-6 shadow-2xl"
                        >
                            <button
                                onClick={() => setMfaModal(null)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {mfaModal === 'enable' ? (
                                <>
                                    <h3 className="text-xl font-bold text-white mb-2">Enable Two-Factor Authentication</h3>
                                    <p className="text-sm text-gray-400 mb-6">
                                        We have sent a 6-digit verification code to <span className="text-blue-400 font-semibold">{user?.email}</span>. Enter the code below to enable 2FA.
                                    </p>

                                    {mfaError && (
                                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm">
                                            {mfaError}
                                        </div>
                                    )}

                                    {mfaSuccess && (
                                        <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-lg mb-4 text-sm">
                                            {mfaSuccess}
                                        </div>
                                    )}

                                    <form onSubmit={handleConfirmEnable2FA} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Verification Code</label>
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white text-center text-2xl font-bold tracking-widest focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                placeholder="******"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={mfaLoading || otpCode.length !== 6}
                                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {mfaLoading ? 'Verifying...' : 'Verify & Enable'}
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-xl font-bold text-white mb-2">Disable Two-Factor Authentication</h3>
                                    <p className="text-sm text-gray-400 mb-6">
                                        To disable 2FA, please enter your current account password to verify your identity.
                                    </p>

                                    {mfaError && (
                                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm">
                                            {mfaError}
                                        </div>
                                    )}

                                    {mfaSuccess && (
                                        <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-lg mb-4 text-sm">
                                            {mfaSuccess}
                                        </div>
                                    )}

                                    <form onSubmit={handleConfirmDisable2FA} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Account Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                                <input
                                                    type="password"
                                                    value={disablePassword}
                                                    onChange={(e) => setDisablePassword(e.target.value)}
                                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                                    placeholder="Enter password"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={mfaLoading || !disablePassword}
                                            className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {mfaLoading ? 'Disabling...' : 'Confirm Disable'}
                                        </button>
                                    </form>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Settings;
