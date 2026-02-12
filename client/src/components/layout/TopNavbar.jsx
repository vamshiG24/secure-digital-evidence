import { useState } from 'react';
import { User, Settings, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationPanel from '../NotificationPanel';

const TopNavbar = () => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="h-16 bg-card border-b border-gray-800 flex items-center justify-end px-8 fixed top-0 right-0 left-60 z-40 transition-all duration-300">
            {/* Right Side Actions */}
            <div className="flex items-center space-x-6">
                <div className="relative">
                    <NotificationPanel />
                </div>

                <div className="h-8 w-[1px] bg-gray-700"></div>

                {/* User Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center space-x-3 hover:bg-gray-800/50 px-3 py-2 rounded-lg transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg">
                            <span className="text-white font-semibold text-sm">
                                {user?.name?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="text-left hidden md:block">
                            <p className="text-sm font-medium text-white">{user?.name}</p>
                            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                        <>
                            {/* Backdrop to close dropdown */}
                            <div
                                className="fixed inset-0 z-30"
                                onClick={() => setIsProfileOpen(false)}
                            ></div>

                            <div className="absolute right-0 mt-2 w-56 bg-card border border-gray-800 rounded-xl shadow-2xl z-40 overflow-hidden">
                                {/* User Info Header */}
                                <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/50">
                                    <p className="text-sm font-semibold text-white">{user?.name}</p>
                                    <p className="text-xs text-gray-400">{user?.email}</p>
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded-full capitalize">
                                        {user?.role}
                                    </span>
                                </div>

                                {/* Menu Items */}
                                <div className="py-2">
                                    <button
                                        onClick={() => {
                                            navigate('/');
                                            setIsProfileOpen(false);
                                        }}
                                        className="w-full flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                                    >
                                        <LayoutDashboard className="w-4 h-4" />
                                        <span className="text-sm">Dashboard</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            navigate('/profile');
                                            setIsProfileOpen(false);
                                        }}
                                        className="w-full flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                        <span className="text-sm">My Profile</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            navigate('/settings');
                                            setIsProfileOpen(false);
                                        }}
                                        className="w-full flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span className="text-sm">Settings</span>
                                    </button>
                                </div>

                                {/* Logout */}
                                <div className="border-t border-gray-800 py-2">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center space-x-3 px-4 py-2 text-red-400 hover:bg-red-900/20 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span className="text-sm font-medium">Logout</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TopNavbar;
