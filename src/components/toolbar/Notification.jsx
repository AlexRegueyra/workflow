// src/components/ui/Notification.jsx
import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// Componente individual de notificación
const NotificationItem = ({
    id,
    message,
    type = NOTIFICATION_TYPES.INFO,
    duration = 4000,
    onClose
}) => {
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        // Animación de progreso
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - (100 / (duration / 100));
            });
        }, 100);

        // Timer para iniciar animación de salida
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => onClose(id), 300);
        }, duration);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [duration, id, onClose]);

    // Determinar el icono según el tipo
    const getIcon = () => {
        switch (type) {
            case NOTIFICATION_TYPES.SUCCESS:
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case NOTIFICATION_TYPES.ERROR:
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            case NOTIFICATION_TYPES.WARNING:
                return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case NOTIFICATION_TYPES.INFO:
            default:
                return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    // Determinar las clases de color según el tipo
    const getTypeClasses = () => {
        switch (type) {
            case NOTIFICATION_TYPES.SUCCESS:
                return {
                    bg: 'bg-green-50',
                    border: 'border-l-4 border-green-500',
                    progress: 'bg-green-500'
                };
            case NOTIFICATION_TYPES.ERROR:
                return {
                    bg: 'bg-red-50',
                    border: 'border-l-4 border-red-500',
                    progress: 'bg-red-500'
                };
            case NOTIFICATION_TYPES.WARNING:
                return {
                    bg: 'bg-amber-50',
                    border: 'border-l-4 border-amber-500',
                    progress: 'bg-amber-500'
                };
            case NOTIFICATION_TYPES.INFO:
            default:
                return {
                    bg: 'bg-blue-50',
                    border: 'border-l-4 border-blue-500',
                    progress: 'bg-blue-500'
                };
        }
    };

    const typeClasses = getTypeClasses();

    return (
        <div
            className={`${typeClasses.bg} ${typeClasses.border} rounded-md shadow-lg mb-2 max-w-sm w-full transform transition-all duration-300 ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
                }`}
        >
            <div className="px-4 py-3 relative">
                <div className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                        {getIcon()}
                    </div>
                    <div className="ml-3 flex-1 mr-4">
                        <p className="text-sm text-gray-800">{message}</p>
                    </div>
                    <button
                        onClick={() => {
                            setIsExiting(true);
                            setTimeout(() => onClose(id), 300);
                        }}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Barra de progreso estilo Instagram */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-md overflow-hidden">
                    <div
                        className={`h-full ${typeClasses.progress} transition-all duration-100 ease-linear`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

// Contenedor de notificaciones
const NotificationContainer = ({ notifications, onClose }) => {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col items-end space-y-2">
            {notifications.map(notification => (
                <NotificationItem
                    key={notification.id}
                    {...notification}
                    onClose={onClose}
                />
            ))}
        </div>
    );
};

// Hook para manejar notificaciones
export const useNotification = () => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = (message, type = NOTIFICATION_TYPES.INFO, duration = 4000) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type, duration }]);
        return id;
    };

    const closeNotification = (id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    // Métodos de conveniencia
    const success = (message, duration) => showNotification(message, NOTIFICATION_TYPES.SUCCESS, duration);
    const error = (message, duration) => showNotification(message, NOTIFICATION_TYPES.ERROR, duration);
    const warning = (message, duration) => showNotification(message, NOTIFICATION_TYPES.WARNING, duration);
    const info = (message, duration) => showNotification(message, NOTIFICATION_TYPES.INFO, duration);

    const NotificationsRenderer = () => (
        <NotificationContainer
            notifications={notifications}
            onClose={closeNotification}
        />
    );

    return {
        notifications,
        showNotification,
        closeNotification,
        success,
        error,
        warning,
        info,
        NotificationsRenderer
    };
};

export { NOTIFICATION_TYPES };
export default NotificationContainer;