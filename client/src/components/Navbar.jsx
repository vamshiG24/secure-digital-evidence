import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, User as UserIcon } from 'lucide-react';
import NotificationPanel from './NotificationPanel';

const Navbar = () => {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <nav className="bg-gray-800 border-b border-gray-700">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center space-x-2">
                        <Shield className="h-8 w-8 text-blue-500" />
                        <span className="text-xl font-bold tracking-wider text-blue-400">SECURE EVIDENCE</span>
                    </Link>

                    <div className="flex items-center space-x-6">
                        {user.role === 'admin' && (
                            <Link to="/logs" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                                System Logs
                            </Link>
                        )}
                        <NotificationPanel />

                        <div className="flex items-center space-x-2 text-gray-300">
                            <UserIcon className="h-5 w-5" />
                            <span>{user.name} ({user.role})</span>
                        </div>
                        <button
                            onClick={logout}
                            className="flex items-center space-x-1 text-red-400 hover:text-red-300 transition-colors"
                        >
                            <LogOut className="h-5 w-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
