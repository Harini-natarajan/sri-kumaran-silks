import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const backendUrl = apiUrl.replace('/api', '');

    useEffect(() => {
        // Skip connecting if we're on vercel as it doesn't support Socket.io
        const isVercel = window.location.hostname.endsWith('vercel.app');
        
        // Connect to the backend
        const newSocket = io(backendUrl, {
            withCredentials: true,
            transports: ['polling', 'websocket'], // Prefer polling first on some serverless setups if needed, or just let it fail
            reconnectionAttempts: 5,
            timeout: 10000,
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to socket server (Admin)');
        });

        newSocket.on('connect_error', (err) => {
            // Only log errors in development or if it's the first few failed attempts
            if (process.env.NODE_ENV === 'development') {
                console.error('Socket connection error (Admin):', err.message);
            }
        });

        return () => {
            newSocket.close();
        };
    }, [backendUrl]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
