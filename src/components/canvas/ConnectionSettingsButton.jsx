// src/components/canvas/ConnectionSettingsButton.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Settings, ArrowRight, CornerDownRight, Zap, X } from 'lucide-react';

const ConnectionSettingsButton = ({
    onTypeChange,
    onToggleAnimation,
    currentType = 'curved',
    showAnimation = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef(null);

    // Cerrar el panel al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="absolute bottom-4 left-4 z-30" ref={panelRef}>
            {/* Botón de configuración */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-3 rounded-full shadow-lg flex items-center justify-center transition-all transform ${isOpen
                        ? 'bg-purple-600 text-white rotate-90'
                        : 'bg-white text-purple-600 hover:bg-purple-50'
                    }`}
                title="Configurar conexiones"
            >
                <Settings className="w-5 h-5" />
            </button>

            {/* Panel de configuración */}
            {isOpen && (
                <div
                    className="absolute bottom-16 left-0 bg-white rounded-lg shadow-xl p-4 w-72 border border-gray-200 transform transition-all duration-200"
                    style={{
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                >
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-gray-800">Estilo de Conexiones</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* Tipos de conexión */}
                        <div className="space-y-2">
                            <label className="text-sm text-gray-700 font-medium">Tipo de Línea</label>
                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    onClick={() => onTypeChange('straight')}
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${currentType === 'straight'
                                            ? 'bg-purple-50 border-purple-300 text-purple-700'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`p-2 rounded-full ${currentType === 'straight' ? 'bg-purple-100' : 'bg-gray-100'
                                        }`}>
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium text-sm">Recta</div>
                                        <div className="text-xs text-gray-500">Conexión directa entre nodos</div>
                                    </div>
                                    {currentType === 'straight' && (
                                        <div className="ml-auto">
                                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                        </div>
                                    )}
                                </button>

                                <button
                                    onClick={() => onTypeChange('curved')}
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${currentType === 'curved'
                                            ? 'bg-purple-50 border-purple-300 text-purple-700'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`p-2 rounded-full ${currentType === 'curved' ? 'bg-purple-100' : 'bg-gray-100'
                                        }`}>
                                        <svg width="16" height="16" viewBox="0 0 24 24">
                                            <path
                                                d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                fill="none"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium text-sm">Curva</div>
                                        <div className="text-xs text-gray-500">Conexión suave con curvas</div>
                                    </div>
                                    {currentType === 'curved' && (
                                        <div className="ml-auto">
                                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                        </div>
                                    )}
                                </button>

                                <button
                                    onClick={() => onTypeChange('angular')}
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${currentType === 'angular'
                                            ? 'bg-purple-50 border-purple-300 text-purple-700'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`p-2 rounded-full ${currentType === 'angular' ? 'bg-purple-100' : 'bg-gray-100'
                                        }`}>
                                        <CornerDownRight className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium text-sm">Angular</div>
                                        <div className="text-xs text-gray-500">Conexión con ángulos rectos</div>
                                    </div>
                                    {currentType === 'angular' && (
                                        <div className="ml-auto">
                                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Separador */}
                        <div className="h-px bg-gray-200 my-3"></div>

                        {/* Toggle de animación */}
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={showAnimation}
                                        onChange={() => onToggleAnimation(!showAnimation)}
                                    />
                                    <div className={`w-10 h-5 rounded-full transition-colors ${showAnimation ? 'bg-purple-500' : 'bg-gray-300'
                                        }`}></div>
                                    <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform transform ${showAnimation ? 'translate-x-5' : ''
                                        }`}></div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Zap className={`w-4 h-4 ${showAnimation ? 'text-purple-500' : 'text-gray-500'}`} />
                                    <span className="text-sm">Animación de flujo</span>
                                </div>
                            </label>
                            <p className="text-xs text-gray-500 ml-12 mt-1">
                                Visualiza el flujo de datos entre nodos
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConnectionSettingsButton;