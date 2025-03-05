// ServiceStatus.jsx
import React, { useState, useEffect } from 'react';
import dbApiService from '../services/dbApiService';

const ServiceStatus = () => {
  const [status, setStatus] = useState({ checking: true });
  const [isExpanded, setIsExpanded] = useState(false);

  const checkStatus = async () => {
    setStatus({ checking: true });
    const result = await dbApiService.checkServiceStatus();
    setStatus({ ...result, checking: false });
  };

  useEffect(() => {
    checkStatus();
    // Verificar cada 30 segundos
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-md p-2 z-50">
      <div 
        className="flex items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div 
          className={`w-3 h-3 rounded-full mr-2 ${
            status.checking 
              ? 'bg-yellow-500' 
              : status.active 
                ? 'bg-green-500' 
                : 'bg-red-500'
          }`}
        />
        <span className="text-sm font-medium">
          {status.checking 
            ? 'Verificando...' 
            : status.active 
              ? 'Servidor activo' 
              : 'Servidor inactivo'
          }
        </span>
      </div>
      
      {isExpanded && (
        <div className="mt-2 text-xs">
          <p className="text-gray-600">{status.message}</p>
          <p className="text-gray-600">Modo: {status.mode}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              checkStatus();
            }}
            className="mt-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          >
            Verificar ahora
          </button>
        </div>
      )}
    </div>
  );
};

export default ServiceStatus;