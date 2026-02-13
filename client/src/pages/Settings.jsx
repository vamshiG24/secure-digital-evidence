import { useState } from 'react';
import { Bell, Moon, Shield, Smartphone, Lock, Eye, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings = () => {
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [pushNotifs, setPushNotifs] = useState(false);

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
                                <p className="text-white font-medium">Two-Factor Authentication</p>
                                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                            </div>
                            <button className="px-4 py-2 border border-blue-600 text-blue-500 hover:bg-blue-600/10 rounded-lg text-sm transition-colors">
                                Enable 2FA
                            </button>
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
        </div>
    );
};

export default Settings;
