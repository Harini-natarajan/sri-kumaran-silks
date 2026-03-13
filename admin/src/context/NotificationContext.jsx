import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './SocketContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [toastNotifications, setToastNotifications] = useState([]);
    const socket = useSocket();
    const dismissTimeoutRefs = useRef({});

    const addNotification = useCallback((notif) => {
        const id = Date.now();
        const fullNotif = { ...notif, id, read: false, createdAt: new Date() };
        
        // Add to main history
        setNotifications(prev => [fullNotif, ...prev].slice(0, 50));
        
        // Add to active toast list
        setToastNotifications(prev => [{ ...fullNotif }, ...prev].slice(0, 5));
        
        // Auto dismiss toast after 5 seconds
        dismissTimeoutRefs.current[id] = setTimeout(() => {
            setToastNotifications(prev => prev.filter(n => n.id !== id));
            delete dismissTimeoutRefs.current[id];
        }, 5000);
    }, []);

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const dismissToast = (id) => {
        setToastNotifications(prev => prev.filter(n => n.id !== id));
        if (dismissTimeoutRefs.current[id]) {
            clearTimeout(dismissTimeoutRefs.current[id]);
            delete dismissTimeoutRefs.current[id];
        }
    };

    useEffect(() => {
        if (socket) {
            socket.on('orderCreated', (data) => {
                addNotification({
                    type: 'order',
                    title: 'New Revenue Inbound',
                    message: `Order #${data.orderId} placed`,
                    subtext: `Amount: ₹${data.amount.toLocaleString()} • ${data.customerName}`
                });
            });

            socket.on('reviewCreated', (data) => {
                addNotification({
                    type: 'review',
                    title: 'Market Sentiment Received',
                    message: `${data.review.rating}★ Review for ${data.productName}`,
                    subtext: `From: ${data.review.name} • "${data.review.comment.slice(0, 30)}..."`
                });
            });

            socket.on('userRegistered', (data) => {
                addNotification({
                    type: 'user',
                    title: 'New Member Joined',
                    message: `${data.name} created an account`,
                    subtext: `Email: ${data.email}`
                });
            });

            socket.on('userUpdated', (data) => {
                addNotification({
                    type: 'update',
                    title: 'Profile Activity Detected',
                    message: `${data.name}: ${data.action}`,
                    subtext: `Details: ${data.details}`
                });
            });

            socket.on('productCreated', (data) => {
                addNotification({
                    type: 'product',
                    title: 'Inventory Expansion',
                    message: `${data.name} added to catalog`,
                    subtext: `Category: ${data.category} • Price: ₹${data.price.toLocaleString()}`
                });
            });

            return () => {
                socket.off('orderCreated');
                socket.off('reviewCreated');
                socket.off('userRegistered');
                socket.off('userUpdated');
                socket.off('productCreated');
            };
        }
    }, [socket, addNotification]);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{ 
            notifications, 
            toastNotifications, 
            unreadCount, 
            markAsRead, 
            markAllAsRead, 
            clearAll, 
            dismissToast 
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
