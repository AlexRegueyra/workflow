// src/components/canvas/EnhancedConnection.jsx
import React, { useState } from 'react';

const ConnectionTypes = {
    STRAIGHT: 'straight',
    CURVED: 'curved',
    ANGULAR: 'angular'
};

const EnhancedConnection = ({
    startNode,
    endNode,
    isSelected = false,
    isValid = true,
    isDragging = false,
    onClick,
    onLabelChange,
    type = ConnectionTypes.CURVED,
    flowAnimation = false,
    label = '',
    animationSpeed = 5000
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [labelText, setLabelText] = useState(label);

    // Calcular puntos de conexión
    const startX = startNode.x + 256; // Asumiendo que el nodo tiene 256px de ancho
    const startY = startNode.y + 32;  // Punto medio del nodo (64px / 2)
    const endX = endNode.x;
    const endY = endNode.y + 32;

    // Obtener el color según validez y selección
    const getStrokeColor = () => {
        if (isDragging) return '#94a3b8';  // Gris
        if (!isValid) return '#ef4444';    // Rojo
        if (isSelected) return '#8b5cf6';  // Púrpura
        return '#3b82f6';                  // Azul
    };

    // Generar el path según el tipo de conexión
    const generatePath = () => {
        switch (type) {
            case ConnectionTypes.STRAIGHT:
                return `M ${startX} ${startY} L ${endX} ${endY}`;

            case ConnectionTypes.ANGULAR:
                const midX = (startX + endX) / 2;
                return `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;

            case ConnectionTypes.CURVED:
            default:
                // Calcular los puntos de control para la curva
                const dx = Math.abs(endX - startX) * 0.5;
                const controlX1 = startX + dx;
                const controlX2 = endX - dx;
                return `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`;
        }
    };

    // Calcular la posición de la etiqueta
    const getLabelPosition = () => {
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;

        // Ajuste vertical para diferentes tipos de conexión
        const offset = type === ConnectionTypes.CURVED ? -15 : -10;

        return {
            x: midX,
            y: midY + offset
        };
    };

    const handleLabelClick = (e) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleLabelChange = (e) => {
        setLabelText(e.target.value);
    };

    const handleLabelBlur = () => {
        setIsEditing(false);
        if (onLabelChange) {
            onLabelChange(labelText);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            setIsEditing(false);
            if (onLabelChange) {
                onLabelChange(labelText);
            }
        }
    };

    const path = generatePath();
    const labelPos = getLabelPosition();
    const stroke = getStrokeColor();

    return (
        <>
            <g onClick={onClick}>
                <path
                    d={path}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={isSelected ? 2.5 : 2}
                    strokeDasharray={isDragging ? "5 3" : "none"}
                    className={`transition-colors duration-300 ${isSelected ? 'shadow-lg' : ''}`}
                />

                {/* Animación de flujo si está habilitada */}
                {flowAnimation && isValid && !isDragging && (
                    <path
                        d={path}
                        fill="none"
                        stroke="rgba(59, 130, 246, 0.5)"
                        strokeWidth={2}
                        strokeDasharray="5 8"
                        className="flow-animation"
                        style={{
                            animation: `flowDash ${animationSpeed}ms linear infinite`,
                        }}
                    />
                )}

                {/* Área invisible más amplia para facilitar clic */}
                <path
                    d={path}
                    stroke="transparent"
                    strokeWidth={10}
                    fill="none"
                    style={{ cursor: 'pointer' }}
                />
            </g>

            {/* Etiqueta de la conexión */}
            {!isDragging && (
                <foreignObject
                    x={labelPos.x - 50}
                    y={labelPos.y - 12}
                    width="100"
                    height="24"
                    style={{ overflow: 'visible' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {isEditing ? (
                        <input
                            type="text"
                            value={labelText}
                            onChange={handleLabelChange}
                            onBlur={handleLabelBlur}
                            onKeyDown={handleKeyDown}
                            className="w-full px-2 py-1 bg-white border rounded shadow-sm text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                        />
                    ) : (
                        label && (
                            <div
                                className={`px-2 py-1 bg-white bg-opacity-80 border rounded text-xs text-center cursor-pointer transition-all ${isSelected ? 'ring-2 ring-purple-300 shadow-sm' : ''
                                    }`}
                                onClick={handleLabelClick}
                            >
                                {label}
                            </div>
                        )
                    )}
                </foreignObject>
            )}
        </>
    );
};

// Exportar tipos de conexión para usar en otros componentes
EnhancedConnection.Types = ConnectionTypes;

export default EnhancedConnection;