import React from 'react';
import { ArrowRight, CornerDownRight, ChevronsRight } from 'lucide-react';

const ConnectionTypeSelector = ({
    currentType,
    onTypeChange,
    showAnimation,
    onToggleAnimation,
    position = 'top-right'
}) => {
    // Determinar la clase de posición
    const positionClass = position === 'top-right'
        ? 'top-4 right-24'
        : position === 'bottom-right'
            ? 'bottom-4 right-24'
            : 'top-4 right-24'; // default

    return (
        <div className={`fixed ${positionClass} bg-white border rounded-lg shadow-lg p-2 z-10`}>
            <div className="text-xs text-gray-500 mb-2 px-1">Tipo de Conexión</div>

            <div className="flex flex-col gap-2">
                <button
                    onClick={() => onTypeChange('straight')}
                    className={`px-3 py-2 rounded flex items-center gap-2 transition-colors ${currentType === 'straight'
                            ? 'bg-blue-100 text-blue-600 font-medium'
                            : 'hover:bg-gray-100'
                        }`}
                >
                    <ArrowRight size={14} />
                    <span className="text-sm">Recta</span>
                </button>

                <button
                    onClick={() => onTypeChange('curved')}
                    className={`px-3 py-2 rounded flex items-center gap-2 transition-colors ${currentType === 'curved'
                            ? 'bg-blue-100 text-blue-600 font-medium'
                            : 'hover:bg-gray-100'
                        }`}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                        />
                    </svg>
                    <span className="text-sm">Curva</span>
                </button>

                <button
                    onClick={() => onTypeChange('angular')}
                    className={`px-3 py-2 rounded flex items-center gap-2 transition-colors ${currentType === 'angular'
                            ? 'bg-blue-100 text-blue-600 font-medium'
                            : 'hover:bg-gray-100'
                        }`}
                >
                    <CornerDownRight size={14} />
                    <span className="text-sm">Angular</span>
                </button>

                <div className="h-px bg-gray-200 my-1" />

                <button
                    onClick={onToggleAnimation}
                    className={`px-3 py-2 rounded flex items-center gap-2 transition-colors ${showAnimation
                            ? 'bg-green-100 text-green-600 font-medium'
                            : 'hover:bg-gray-100'
                        }`}
                >
                    <ChevronsRight size={14} className={showAnimation ? 'animate-pulse' : ''} />
                    <span className="text-sm">Animación</span>
                </button>
            </div>
        </div>
    );
};

export default ConnectionTypeSelector;