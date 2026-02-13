import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

const Layout = ({ children }) => {
    const { user } = useAuth();
    return (
        <div className="flex min-h-screen bg-background text-text font-sans selection:bg-blue-500/30">
            {/* Sidebar */}
            <Sidebar />

            <div className={`flex-1 flex flex-col ${user?.role === 'analyst' ? 'ml-0' : 'ml-60'} pt-16 transition-all duration-300`}>
                {/* Fixed Top Navbar */}
                <TopNavbar />

                {/* Main Content Area */}
                <main className="flex-1 p-8 overflow-y-auto relative z-0">
                    <div className="max-w-7xl mx-auto animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
