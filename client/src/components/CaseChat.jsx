import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Send, MessageSquare } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const CaseChat = ({ caseId }) => {
    const { user } = useAuth();
    const socket = useSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom of messages list
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Fetch message history on mount or when caseId changes
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const { data } = await axios.get(`${API_BASE_URL}/api/cases/${caseId}/messages`, config);
                setMessages(data);
            } catch (error) {
                console.error('Error fetching case messages:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [caseId]);

    // Setup Socket room and listener
    useEffect(() => {
        if (!socket) return;

        // Join case room
        socket.emit('join_case_room', caseId);

        // Listen for new messages
        const handleNewMessage = (message) => {
            // Only add if message belongs to this case (precautionary)
            if (message.caseId === caseId) {
                setMessages((prev) => [...prev, message]);
            }
        };

        socket.on('new_message', handleNewMessage);

        return () => {
            socket.off('new_message', handleNewMessage);
        };
    }, [socket, caseId]);

    // Scroll to bottom whenever messages list updates
    useEffect(() => {
        if (!loading) {
            scrollToBottom();
        }
    }, [messages, loading]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageText = newMessage;
        setNewMessage(''); // optimistic UI clear

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            // Send message to REST API (which saves it and triggers socket broadcast)
            await axios.post(`${API_BASE_URL}/api/cases/${caseId}/messages`, { message: messageText }, config);
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        }
    };

    if (loading) {
        return (
            <div className="bg-card border border-gray-800 rounded-2xl p-6 h-[500px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-card border border-gray-800 rounded-2xl flex flex-col h-[500px] shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-gray-900/30 border-b border-gray-800 flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <div>
                    <h3 className="text-white font-bold">Case Collaboration</h3>
                    <p className="text-xs text-gray-500">Secure live chat for assigned staff</p>
                </div>
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 custom-scrollbar bg-gray-950/20">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
                        <MessageSquare className="w-8 h-8 opacity-30" />
                        <p className="text-sm">No collaboration messages yet.</p>
                        <p className="text-xs opacity-60">Send a note below to start collaborating.</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwnMessage = msg.sender?._id === user?._id || msg.sender?.id === user?.id || msg.sender === user?._id;
                        const senderName = msg.sender?.name || 'Unknown User';
                        const senderRole = msg.sender?.role ? msg.sender.role.charAt(0).toUpperCase() + msg.sender.role.slice(1) : 'Staff';

                        return (
                            <div
                                key={msg._id || Math.random()}
                                className={`flex flex-col max-w-[80%] ${isOwnMessage ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                            >
                                <span className="text-xs text-gray-500 mb-1 px-1">
                                    {!isOwnMessage && <span className="font-semibold text-gray-400">{senderName} ({senderRole})</span>}
                                    <span className="ml-1 opacity-70">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </span>
                                <div
                                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed border ${
                                        isOwnMessage
                                            ? 'bg-blue-600 border-blue-500 text-white rounded-tr-none shadow-md shadow-blue-900/20'
                                            : 'bg-gray-800/80 border-gray-700 text-gray-200 rounded-tl-none'
                                    }`}
                                >
                                    {msg.message}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSendMessage} className="p-4 bg-gray-900/40 border-t border-gray-800 flex items-center space-x-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a secure message..."
                    className="flex-1 bg-gray-950 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm transition-colors"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl p-2.5 transition-colors flex items-center justify-center shrink-0"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
};

export default CaseChat;
