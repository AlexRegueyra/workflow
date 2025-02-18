import React from 'react';

const GridBackground = ({
    gridSize = 20,
    gridColor = 'rgba(0, 0, 0, 0.1)',
    snapToGrid = true,
    showMainLines = true,
    mainLineEvery = 5,
    mainLineColor = 'rgba(0, 0, 0, 0.2)',
    width = '100%',
    height = '100%'
}) => {
    return (
        <div 
            className="absolute inset-0 overflow-hidden"
            style={{
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0
            }}
        >
            {/* Cuadrícula simple para mayor rendimiento */}
            <div 
                className="w-full h-full"
                style={{
                    backgroundSize: `${gridSize}px ${gridSize}px`,
                    backgroundImage: `
                        linear-gradient(to right, ${gridColor} 1px, transparent 1px),
                        linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
                    `,
                    backgroundPosition: '0 0',
                    opacity: 1
                }}
            />
            
            {/* Líneas principales */}
            {showMainLines && (
                <div 
                    className="absolute inset-0"
                    style={{
                        backgroundSize: `${gridSize * mainLineEvery}px ${gridSize * mainLineEvery}px`,
                        backgroundImage: `
                            linear-gradient(to right, ${mainLineColor} 1px, transparent 1px),
                            linear-gradient(to bottom, ${mainLineColor} 1px, transparent 1px)
                        `,
                        backgroundPosition: '0 0',
                        opacity: 1
                    }}
                />
            )}
        </div>
    );
};

// Función de ayuda para exportar junto con el componente
export const snapToGrid = (position, gridSize = 20) => {
    return {
        x: Math.round(position.x / gridSize) * gridSize,
        y: Math.round(position.y / gridSize) * gridSize
    };
};

export default GridBackground;