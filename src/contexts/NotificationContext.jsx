// src/contexts/NotificationContext.js
import React, { createContext, useContext } from 'react';
import useNotificationBell from '../components/toolbar/NotificationBell';


// Crear el contexto
const NotificationContext = createContext(null);

// Proveedor de notificaciones
export const NotificationProvider = ({ children }) => {
    const notificationSystem = useNotificationBell();

    return (
        <NotificationContext.Provider value={notificationSystem}>
            {children}
            {/* Renderizar aquí el NotificationRenderer para que sea accesible globalmente */}
            <div className="notification-container">
                {notificationSystem.NotificationBell && React.createElement(notificationSystem.NotificationBell)}
            </div>
        </NotificationContext.Provider>
    );
};

// Hook para usar las notificaciones
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications debe usarse dentro de un NotificationProvider');
    }
    return context;
};

// Exportar también el componente de la campanita por separado
export const NotificationBellComponent = () => {
    const { NotificationBell } = useNotifications();
    return NotificationBell ? <NotificationBell /> : null;
};