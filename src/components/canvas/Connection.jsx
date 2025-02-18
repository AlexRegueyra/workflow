import { useState } from 'react';

const Connection = ({
    startNode,
    endNode,
    isSelected = false,
    onClick,
    isValid = true,
    isDragging = false
}) => {
    // Calcular puntos de inicio y fin
    const startX = startNode.x + 256;
    const startY = startNode.y + 32;
    const endX = endNode.x;
    const endY = endNode.y + 32;

    // Calcular puntos de control para la curva
    const distance = Math.abs(endX - startX);
    const controlX1 = startX + (distance * 0.25);
    const controlX2 = endX - (distance * 0.25);

    // Color según el estado
    const getStrokeColor = () => {
        if (!isValid) return '#ef4444'; // Rojo para conexiones inválidas
        if (isSelected) return '#9333ea'; // Morado para seleccionada
        if (isDragging) return '#3b82f6'; // Azul para arrastre
        return '#94a3b8'; // Gris por defecto
    };

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <svg className="absolute top-0 left-0 w-full h-full">
                <path
                    d={`M ${startX} ${startY} 
                       C ${controlX1} ${startY},
                         ${controlX2} ${endY},
                         ${endX} ${endY}`}
                    stroke={getStrokeColor()}
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray={isDragging ? "5,5" : "none"}
                    className="transition-colors duration-200"
                />
                <circle cx={startX} cy={startY} r="4" fill={getStrokeColor()} />
                <circle cx={endX} cy={endY} r="4" fill={getStrokeColor()} />
            </svg>
        </div>
    );
};

export default Connection;