// src/components/ui/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, AlertCircle, Info } from 'lucide-react';

// Tipos de notificaciones
export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

const NotificationItem = ({ notification, onRemove }) => {
    const getIcon = () => {
        switch (notification.type) {
            case NOTIFICATION_TYPES.SUCCESS:
                return <Check className="w-4 h-4 text-green-500" />;
            case NOTIFICATION_TYPES.ERROR:
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            case NOTIFICATION_TYPES.WARNING:
                return <AlertCircle className="w-4 h-4 text-amber-500" />;
            case NOTIFICATION_TYPES.INFO:
            default:
                return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <div className="flex items-start p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex-shrink-0 mr-2">
                {getIcon()}
            </div>
            <div className="flex-1 mr-4">
                <p className="text-sm text-gray-700">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                </p>
            </div>
            <button
                onClick={() => onRemove(notification.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export const useNotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const bellRef = useRef(null);

    // Añadir una notificación
    const addNotification = (message, type = NOTIFICATION_TYPES.INFO) => {
        const newNotification = {
            id: Date.now(),
            message,
            type,
            timestamp: Date.now(),
            read: false
        };

        setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Mantener máximo 50 notificaciones
        setUnreadCount(count => count + 1);

        return newNotification.id;
    };

    // Eliminar una notificación
    const removeNotification = (id) => {
        setNotifications(prev => {
            const notification = prev.find(n => n.id === id);
            const isUnread = notification && !notification.read;

            if (isUnread) {
                setUnreadCount(count => Math.max(0, count - 1));
            }

            return prev.filter(n => n.id === id);
        });
    };

    // Marcar todas como leídas
    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    // Eliminar todas las notificaciones
    const clearAll = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    // Métodos de conveniencia
    const success = (message) => addNotification(message, NOTIFICATION_TYPES.SUCCESS);
    const error = (message) => addNotification(message, NOTIFICATION_TYPES.ERROR);
    const warning = (message) => addNotification(message, NOTIFICATION_TYPES.WARNING);
    const info = (message) => addNotification(message, NOTIFICATION_TYPES.INFO);

    // Cerrar el panel al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (bellRef.current && !bellRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Componente de la campanita
    const NotificationBell = () => {
        return (
            <div ref={bellRef} className="relative inline-block">
                <button
                    onClick={() => {
                        setIsOpen(!isOpen);
                        if (!isOpen && unreadCount > 0) {
                            markAllAsRead();
                        }
                    }}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                >
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {isOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-md z-50 max-h-96 overflow-y-auto">
                        <div className="sticky top-0 bg-white p-3 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-medium text-gray-700">Notificaciones</h3>
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                    Borrar todo
                                </button>
                            )}
                        </div>

                        <div>
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 italic">
                                    No hay notificaciones
                                </div>
                            ) : (
                                notifications.map(notification => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onRemove={removeNotification}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return {
        addNotification,
        removeNotification,
        markAllAsRead,
        clearAll,
        success,
        error,
        warning,
        info,
        notifications,
        unreadCount,
        NotificationBell
    };
};

export default useNotificationBell;