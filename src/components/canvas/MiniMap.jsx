import React, { useEffect, useRef, useState } from 'react';

const MiniMap = ({ 
    nodes, 
    connections, 
    containerWidth = 200, 
    containerHeight = 150,
    onViewportChange,
    scale = 1
}) => {
    const canvasRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [viewportRect, setViewportRect] = useState(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Limpiar canvas
        ctx.clearRect(0, 0, containerWidth, containerHeight);
        
        // Si no hay nodos, dibuja solo el fondo
        if (!nodes.length) {
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, containerWidth, containerHeight);
            return;
        }
        
        // Calcular límites del workflow
        const nodePositions = nodes.map(node => ({ x: node.x, y: node.y }));
        const minX = Math.min(...nodePositions.map(pos => pos.x)) - 50;
        const maxX = Math.max(...nodePositions.map(pos => pos.x)) + 300; // Ancho del nodo + margen
        const minY = Math.min(...nodePositions.map(pos => pos.y)) - 50;
        const maxY = Math.max(...nodePositions.map(pos => pos.y)) + 100; // Alto del nodo + margen
        
        const workflowWidth = Math.max(maxX - minX, 500);
        const workflowHeight = Math.max(maxY - minY, 300);
        
        const scaleX = containerWidth / workflowWidth;
        const scaleY = containerHeight / workflowHeight;
        const minimapScale = Math.min(scaleX, scaleY);
        
        // Dibujar fondo
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, containerWidth, containerHeight);
        
        // Dibujar cuadrícula simple
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 0.5;
        const gridSize = 20;
        for (let x = 0; x < containerWidth; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, containerHeight);
            ctx.stroke();
        }
        for (let y = 0; y < containerHeight; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(containerWidth, y);
            ctx.stroke();
        }

        // Calcular escalas y offset para centrar el contenido
        const offsetX = (containerWidth - workflowWidth * minimapScale) / 2;
        const offsetY = (containerHeight - workflowHeight * minimapScale) / 2;

        // Dibujar conexiones
        ctx.beginPath();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        connections.forEach(connection => {
            const sourceNode = connection.startNode;
            const targetNode = connection.endNode;
            
            if (sourceNode && targetNode) {
                const startX = (sourceNode.x - minX) * minimapScale + offsetX;
                const startY = (sourceNode.y - minY) * minimapScale + offsetY;
                const endX = (targetNode.x - minX) * minimapScale + offsetX;
                const endY = (targetNode.y - minY) * minimapScale + offsetY;
                
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
            }
        });
        ctx.stroke();
        
        // Dibujar nodos
        nodes.forEach(node => {
            const x = (node.x - minX) * minimapScale + offsetX;
            const y = (node.y - minY) * minimapScale + offsetY;
            const width = 256 * minimapScale;  // Ancho estimado del nodo
            const height = 64 * minimapScale;  // Alto estimado del nodo
            
            // Sombra del nodo
            ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            // Fondo del nodo
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(x, y, width, height);
            
            // Resetear sombra
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        });

        // Calcular y dibujar el viewport visible
        if (scale) {
            const containerRect = canvas.parentElement.parentElement.getBoundingClientRect();
            const visibleWidth = containerRect.width / scale;
            const visibleHeight = containerRect.height / scale;
            
            // Ajustar por posición actual del viewport
            const viewX = ((-position.x || 0) + minX) * minimapScale + offsetX;
            const viewY = ((-position.y || 0) + minY) * minimapScale + offsetY;
            const viewW = visibleWidth * minimapScale;
            const viewH = visibleHeight * minimapScale;
            
            // Guardar para uso en interacciones
            setViewportRect({
                x: viewX,
                y: viewY,
                width: viewW,
                height: viewH,
                offsetX,
                offsetY,
                minimapScale,
                minX,
                minY
            });
            
            // Dibujar recuadro del viewport
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.strokeRect(viewX, viewY, viewW, viewH);
        }
    }, [nodes, connections, containerWidth, containerHeight, scale]);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        updateViewport(e);
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            updateViewport(e);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const updateViewport = (e) => {
        if (!viewportRect || !onViewportChange) return;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Convertir coordenadas del minimapa a coordenadas del workflow
        const workflowX = (x - viewportRect.offsetX) / viewportRect.minimapScale + viewportRect.minX;
        const workflowY = (y - viewportRect.offsetY) / viewportRect.minimapScale + viewportRect.minY;
        
        onViewportChange({ x: workflowX, y: workflowY });
    };

    // Recuperar 'position' del contexto o props
    const position = { x: 0, y: 0 }; // Cámbialo para obtenerlo de props si es necesario

    return (
        <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-2 z-20">
            <div className="text-xs text-gray-500 mb-1 px-1 flex justify-between">
                <span>Vista General</span>
                <span>{Math.round(scale * 100)}%</span>
            </div>
            <canvas
                ref={canvasRef}
                width={containerWidth}
                height={containerHeight}
                className="border rounded cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />
            <div className="flex justify-between mt-1 px-1 text-xs text-gray-400">
                <span>{nodes.length} nodos</span>
                <span>{connections.length} conexiones</span>
            </div>
        </div>
    );
};

export default MiniMap;