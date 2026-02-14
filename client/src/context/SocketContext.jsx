import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SOCKET_URL } from '../config/api';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            // Initialize socket
            const newSocket = io(SOCKET_URL, {
                transports: ['websocket', 'polling'], // ensure broad compatibility
                reconnectionAttempts: 5
            });

            // Handler for connection
            const onConnect = () => {
                console.log('Socket connected:', newSocket.id);
                const userId = user._id || user.id;
                console.log('Joining room for user:', userId);
                newSocket.emit('join_room', userId);
            };

            newSocket.on('connect', onConnect);

            // If already connected by the time we bind (rare but possible)
            if (newSocket.connected) {
                onConnect();
            }

            setSocket(newSocket);

            return () => {
                newSocket.off('connect', onConnect);
                newSocket.close();
            };
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
