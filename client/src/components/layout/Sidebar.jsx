import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, FileText, Upload, Shield, Bell, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Cases', path: '/cases', icon: Briefcase }, // Assuming we'll have a dedicated cases list route or reuse dashboard
        // Admin only
        ...(user?.role === 'admin' ? [
            { name: 'Create Case', path: '/create-case', icon: FileText },
            { name: 'System Logs', path: '/logs', icon: Shield }
        ] : []),
    ];

    return (
        <div className="h-screen w-60 bg-card border-r border-gray-800 flex flex-col fixed left-0 top-0 transition-all duration-300">
            {/* Logo Area */}
            <div className="p-6 border-b border-gray-800 flex items-center space-x-3 overflow-hidden">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-base font-bold text-white tracking-wider whitespace-nowrap">SECURE<span className="text-blue-500">EVIDENCE</span></h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">Menu</div>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                            )}
                        >
                            <Icon className={clsx("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-gray-500 group-hover:text-white")} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile & Logout */}
            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center space-x-3 mb-4 px-2">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-red-900/20 hover:text-red-400 text-gray-400 py-2 rounded-lg transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
