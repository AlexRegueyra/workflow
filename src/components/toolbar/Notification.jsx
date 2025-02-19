// src/components/ui/TelegramNotification.jsx
import React, { useState, useEffect, useRef, createContext, useContext, useReducer } from 'react';
import { Bell, X, Check, AlertCircle, Info, AlertTriangle, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Tipos de notificaciones
export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// Acciones para el reducer
const ACTIONS = {
    ADD_NOTIFICATION: 'add_notification',
    REMOVE_ACTIVE: 'remove_active',
    REMOVE_NOTIFICATION: 'remove_notification',
    MARK_AS_READ: 'mark_as_read',
    MARK_ALL_READ: 'mark_all_read',
    CLEAR_ALL: 'clear_all'
};

// Reducer para manejar el estado
const notificationReducer = (state, action) => {
    switch (action.type) {
        case ACTIONS.ADD_NOTIFICATION:
            return {
                ...state,
                history: [action.payload, ...state.history].slice(0, 100), // Limitamos a 100 notificaciones
                active: [action.payload, ...state.active],
                unreadCount: state.unreadCount + 1
            };

        case ACTIONS.REMOVE_ACTIVE:
            return {
                ...state,
                active: state.active.filter(n => n.id !== action.payload)
                // No modificamos el contador ni la historia aquí
            };

        case ACTIONS.REMOVE_NOTIFICATION:
            const notification = state.history.find(n => n.id === action.payload);
            return {
                ...state,
                history: state.history.filter(n => n.id !== action.payload),
                active: state.active.filter(n => n.id !== action.payload),
                unreadCount: notification && !notification.read
                    ? Math.max(0, state.unreadCount - 1)
                    : state.unreadCount
            };

        case ACTIONS.MARK_AS_READ:
            return {
                ...state,
                history: state.history.map(n =>
                    n.id === action.payload && !n.read
                        ? { ...n, read: true }
                        : n
                ),
                unreadCount: state.history.find(n => n.id === action.payload && !n.read)
                    ? Math.max(0, state.unreadCount - 1)
                    : state.unreadCount
            };

        case ACTIONS.MARK_ALL_READ:
            return {
                ...state,
                history: state.history.map(n => ({ ...n, read: true })),
                unreadCount: 0
            };

        case ACTIONS.CLEAR_ALL:
            return {
                ...state,
                history: [],
                active: [],
                unreadCount: 0
            };

        default:
            return state;
    }
};

// Estado inicial
const initialState = {
    history: [],
    active: [],
    unreadCount: 0
};

// Componente de notificación individual (estilo Telegram)
const TelegramNotification = ({
    id,
    message,
    type = NOTIFICATION_TYPES.INFO,
    duration = 5000,
    onClose,
    onRead
}) => {
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);
    const notificationRef = useRef(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        // Animar entrada
        setTimeout(() => {
            if (notificationRef.current) {
                notificationRef.current.style.transform = 'translateX(0)';
                notificationRef.current.style.opacity = '1';
            }
        }, 10);

        // Iniciar la barra de progreso
        intervalRef.current = setInterval(() => {
            setProgress(prev => {
                if (prev <= 0) {
                    clearInterval(intervalRef.current);
                    return 0;
                }
                return prev - (100 / (duration / 100));
            });
        }, 100);

        // Configurar temporizador para salida
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => {
            clearTimeout(timer);
            clearInterval(intervalRef.current);
        };
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);

        // Solo marcar como leída
        if (onRead) {
            onRead(id);
        }

        // Animar salida y luego cerrar
        setTimeout(() => {
            if (onClose) {
                onClose(id);
            }
        }, 300);
    };

    // Obtener icono según tipo
    const getIcon = () => {
        switch (type) {
            case NOTIFICATION_TYPES.SUCCESS:
                return <Check className="w-5 h-5 text-white" />;
            case NOTIFICATION_TYPES.ERROR:
                return <AlertCircle className="w-5 h-5 text-white" />;
            case NOTIFICATION_TYPES.WARNING:
                return <AlertTriangle className="w-5 h-5 text-white" />;
            case NOTIFICATION_TYPES.INFO:
            default:
                return <Info className="w-5 h-5 text-white" />;
        }
    };

    // Obtener clases según tipo
    const getTypeClasses = () => {
        switch (type) {
            case NOTIFICATION_TYPES.SUCCESS:
                return {
                    bg: 'bg-green-500',
                    progress: 'bg-green-300'
                };
            case NOTIFICATION_TYPES.ERROR:
                return {
                    bg: 'bg-red-500',
                    progress: 'bg-red-300'
                };
            case NOTIFICATION_TYPES.WARNING:
                return {
                    bg: 'bg-amber-500',
                    progress: 'bg-amber-300'
                };
            case NOTIFICATION_TYPES.INFO:
            default:
                return {
                    bg: 'bg-blue-500',
                    progress: 'bg-blue-300'
                };
        }
    };

    const typeClasses = getTypeClasses();

    return (
        <div
            ref={notificationRef}
            className={`fixed rounded-lg shadow-lg max-w-sm transform transition-all duration-300 overflow-hidden ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-full opacity-0'
                } z-50`}
            style={{
                left: '20px',
                bottom: `${20}px`,
                width: '300px'
            }}
        >
            <div className={`flex items-start p-3 ${typeClasses.bg}`}>
                <div className="flex-shrink-0 mr-3">
                    {getIcon()}
                </div>
                <div className="flex-1 mr-2">
                    <p className="text-sm text-white">{message}</p>
                </div>
                <button
                    onClick={handleClose}
                    className="flex-shrink-0 text-white opacity-70 hover:opacity-100 transition-opacity"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Barra de progreso */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-20 overflow-hidden">
                <div
                    className={`h-full ${typeClasses.progress} transition-all duration-100 ease-linear`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

// Contenedor para las notificaciones activas
const TelegramNotificationContainer = ({ notifications, onClose, onRead }) => {
    return (
        <>
            {notifications.map((notification, index) => (
                <TelegramNotification
                    key={notification.id}
                    {...notification}
                    onClose={onClose}
                    onRead={onRead}
                    style={{ bottom: `${20 + index * 80}px` }}
                />
            ))}
        </>
    );
};

// Componente de campanita con contador y menú desplegable
const NotificationBell = ({
    unreadCount,
    notifications = [],
    onAction
}) => {
    // Siempre mostrar el contador total de notificaciones
    const totalCount = notifications.length;
    const [isOpen, setIsOpen] = useState(false);
    const bellRef = useRef(null);

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (bellRef.current && !bellRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            onAction('markAllRead');
        }
    };

    // Obtener icono según tipo de notificación
    const getIcon = (type) => {
        switch (type) {
            case NOTIFICATION_TYPES.SUCCESS:
                return <Check className="w-4 h-4 text-green-500" />;
            case NOTIFICATION_TYPES.ERROR:
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            case NOTIFICATION_TYPES.WARNING:
                return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            default:
                return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={bellRef}>
            <button
                onClick={toggleMenu}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                aria-label="Notificaciones"
            >
                <Bell className="w-5 h-5 text-gray-600" />
                {/* Siempre mostrar el contador, con estilo diferente si hay no leídas */}
                <span
                    className={`absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs ${unreadCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
                        } text-white rounded-full`}
                >
                    {totalCount > 9 ? '9+' : totalCount}
                </span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="font-medium text-gray-800">Notificaciones</h3>
                        {notifications.length > 0 && (
                            <div className="flex space-x-2">
                                <button
                                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                    onClick={() => {
                                        onAction('markAllRead');
                                    }}
                                >
                                    Marcar todo como leído
                                </button>
                                <button
                                    className="text-xs text-red-600 hover:text-red-800 transition-colors flex items-center"
                                    onClick={() => {
                                        onAction('clearAll');
                                    }}
                                >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Limpiar
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                No hay notificaciones
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <div className="flex">
                                        <div className="flex-shrink-0 mr-2">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-800">{notification.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(notification.timestamp).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                onAction('remove', notification.id);
                                            }}
                                            className="ml-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                            aria-label="Eliminar notificación"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Crear contexto
const NotificationContext = createContext(null);

// Proveedor de notificaciones mejorado
export const TelegramNotificationProvider = ({ children, maxActiveNotifications = 3 }) => {
    const [state, dispatch] = useReducer(notificationReducer, initialState);

    // Función para añadir notificación
    const addNotification = (message, type = NOTIFICATION_TYPES.INFO, options = {}) => {
        const id = options.id || uuidv4();
        const duration = options.duration || 5000;

        const newNotification = {
            id,
            message,
            type,
            timestamp: Date.now(),
            read: false,
            duration
        };

        dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: newNotification });

        return id;
    };

    // Eliminar notificación activa (visible)
    const removeActiveNotification = (id) => {
        dispatch({ type: ACTIONS.REMOVE_ACTIVE, payload: id });
        dispatch({ type: ACTIONS.MARK_AS_READ, payload: id });
    };

    // Eliminar notificación del historial
    const removeNotification = (id) => {
        dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: id });
    };

    // Marcar notificación como leída
    const markAsRead = (id) => {
        dispatch({ type: ACTIONS.MARK_AS_READ, payload: id });
    };

    // Marcar todas como leídas
    const markAllAsRead = () => {
        dispatch({ type: ACTIONS.MARK_ALL_READ });
    };

    // Limpiar todas
    const clearAll = () => {
        dispatch({ type: ACTIONS.CLEAR_ALL });
    };

    // Manejar acciones desde la campanita
    const handleBellAction = (action, id) => {
        switch (action) {
            case 'remove':
                removeNotification(id);
                break;
            case 'markAllRead':
                markAllAsRead();
                break;
            case 'clearAll':
                clearAll();
                break;
            default:
                break;
        }
    };

    // Funciones de conveniencia
    const success = (message, options = {}) =>
        addNotification(message, NOTIFICATION_TYPES.SUCCESS, options);

    const error = (message, options = {}) =>
        addNotification(message, NOTIFICATION_TYPES.ERROR, options);

    const warning = (message, options = {}) =>
        addNotification(message, NOTIFICATION_TYPES.WARNING, options);

    const info = (message, options = {}) =>
        addNotification(message, NOTIFICATION_TYPES.INFO, options);

    // Limitar notificaciones activas a mostrar
    const activeNotifications = state.active.slice(0, maxActiveNotifications);

    // Renderizar campanita
    const NotificationBellComponent = () => (
        <NotificationBell
            unreadCount={state.unreadCount}
            notifications={state.history}
            onAction={handleBellAction}
        />
    );

    return (
        <NotificationContext.Provider
            value={{
                notifications: state.history,
                activeNotifications: state.active,
                unreadCount: state.unreadCount,
                addNotification,
                removeNotification,
                markAsRead,
                markAllAsRead,
                clearAll,
                success,
                error,
                warning,
                info,
                NotificationBell: NotificationBellComponent
            }}
        >
            {children}

            {/* Contenedor de notificaciones activas */}
            <TelegramNotificationContainer
                notifications={activeNotifications}
                onClose={removeActiveNotification}
                onRead={markAsRead}
            />
        </NotificationContext.Provider>
    );
};

// Hook para usar notificaciones
export const useTelegramNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useTelegramNotifications debe usarse dentro de TelegramNotificationProvider');
    }
    return context;
};