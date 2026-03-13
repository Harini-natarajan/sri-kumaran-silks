import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const backendUrl = apiUrl.replace('/api', '');

    useEffect(() => {
        // Connect to the backend
        const newSocket = io(backendUrl, {
            withCredentials: true,
            transports: ['polling', 'websocket'],
            reconnectionAttempts: 5,
            timeout: 10000,
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.info('%cSocket.io Connected', 'color: green; font-weight: bold', newSocket.id);
        });

        newSocket.on('connect_error', (err) => {
            if (process.env.NODE_ENV === 'development') {
                console.error('Socket connection error:', err.message);
            }
        });

        newSocket.on('stockUpdate', (data) => {
            console.log('%cStock Update Received:', 'color: orange; font-weight: bold', data);
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
