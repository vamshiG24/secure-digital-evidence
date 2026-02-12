import { useState, useEffect, useRef } from 'react';
import { Terminal, Clock, Shield, Search, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AuditLogViewer = ({ logs = [], loading = false, onRefresh }) => {
    const [displayedLogs, setDisplayedLogs] = useState([]);
    const [filter, setFilter] = useState('');
    const bottomRef = useRef(null);

    // Simulate streaming effect on load
    useEffect(() => {
        if (logs.length > 0) {
            setDisplayedLogs([]);
            let i = 0;
            const interval = setInterval(() => {
                setDisplayedLogs(prev => [...prev, logs[i]]);
                i++;
                if (i === logs.length) clearInterval(interval);
            }, 50); // Speed of "streaming"
            return () => clearInterval(interval);
        }
    }, [logs]);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [displayedLogs]);

    const filteredLogs = displayedLogs.filter(log =>
        JSON.stringify(log).toLowerCase().includes(filter.toLowerCase())
    );

    const getLogColor = (action) => {
        if (action.includes('DELETE') || action.includes('unauthorized')) return 'text-red-500';
        if (action.includes('UPDATE') || action.includes('EDIT')) return 'text-yellow-500';
        if (action.includes('LOGIN')) return 'text-blue-400';
        return 'text-green-400';
    };

    return (
        <div className="bg-black border border-gray-800 rounded-xl overflow-hidden shadow-2xl font-mono text-sm">
            {/* Terminal Header */}
            <div className="bg-gray-900 border-b border-gray-800 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="ml-3 flex items-center gap-2 text-gray-400 text-xs">
                        <Terminal className="w-3 h-3" />
                        <span>root@secure-system:~</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                        <input
                            type="text"
                            placeholder="grep logs..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded-md py-1 pl-7 pr-3 text-xs text-gray-300 focus:outline-none focus:border-green-500 w-48"
                        />
                    </div>
                    <button onClick={onRefresh} className="text-gray-500 hover:text-green-400 transition-colors">
                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Terminal Body */}
            <div className="p-4 h-[600px] overflow-y-auto custom-scrollbar bg-black/95">
                <div className="space-y-1">
                    {loading && displayedLogs.length === 0 && (
                        <div className="text-green-500 animate-pulse">Initializing generic audit protocol...</div>
                    )}

                    <AnimatePresence>
                        {filteredLogs.map((log, index) => (
                            <motion.div
                                key={log._id || index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex gap-3 hover:bg-gray-900/50 p-1 rounded group"
                            >
                                <span className="text-gray-600 min-w-[150px]">
                                    [{new Date(log.timestamp).toLocaleTimeString()}]
                                </span>
                                <span className="text-purple-400 min-w-[100px]">
                                    {log.ipAddress || 'unknown'}
                                </span>
                                <span className="text-orange-400 min-w-[120px]">
                                    {log.user?.name || 'SYSTEM'}
                                </span>
                                <span className={`font-bold min-w-[150px] ${getLogColor(log.action)}`}>
                                    {log.action}
                                </span>
                                <span className="text-gray-400 break-all">
                                    {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                                </span>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Blinking Cursor */}
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-green-500">➜</span>
                        <span className="w-2 h-4 bg-green-500 animate-pulse"></span>
                    </div>

                    {!loading && displayedLogs.length === 0 && (
                        <div className="mt-4 text-gray-500 text-xs font-mono ml-6">
                            [SYSTEM] No audit records found. Waiting for system events...
                        </div>
                    )}

                    <div ref={bottomRef}></div>
                </div>
            </div>
        </div>
    );
};

export default AuditLogViewer;
