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
        const isProduction = import.meta.env.PROD;
        const isVercel = window.location.hostname.endsWith('vercel.app');

        if (isProduction && isVercel) {
            return;
        }

        // Connect to the backend
        const newSocket = io(backendUrl, {
            withCredentials: true,
            transports: ['polling', 'websocket'],
            reconnectionAttempts: 3,
            timeout: 5000,
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.info('%cSocket.io Connected', 'color: green; font-weight: bold', newSocket.id);
        });

        newSocket.on('connect_error', (err) => {
            if (!isProduction) {
                console.error('Socket connection error:', err.message);
            }
        });

        newSocket.on('stockUpdate', (data) => {
            if (!isProduction) {
                console.log('%cStock Update Received:', 'color: orange; font-weight: bold', data);
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
