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
        const ctx = canvas.getContext('2d');
        
        // Limpiar canvas
        ctx.clearRect(0, 0, containerWidth, containerHeight);
        
        // Calcular límites del workflow
        const nodePositions = nodes.map(node => ({ x: node.x, y: node.y }));
        const minX = Math.min(...nodePositions.map(pos => pos.x));
        const maxX = Math.max(...nodePositions.map(pos => pos.x));
        const minY = Math.min(...nodePositions.map(pos => pos.y));
        const maxY = Math.max(...nodePositions.map(pos => pos.y));
        
        const padding = 20;
        const workflowWidth = maxX - minX + padding * 2;
        const workflowHeight = maxY - minY + padding * 2;
        
        const scaleX = containerWidth / workflowWidth;
        const scaleY = containerHeight / workflowHeight;
        const minimapScale = Math.min(scaleX, scaleY);
        
        // Dibujar fondo con cuadrícula
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, containerWidth, containerHeight);
        ctx.strokeStyle = '#e9ecef';
        const gridSize = 10;
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

        // Dibujar conexiones
        ctx.beginPath();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        connections.forEach(connection => {
            const sourceNode = nodes.find(n => n.id === connection.startNode.id);
            const targetNode = nodes.find(n => n.id === connection.endNode.id);
            
            if (sourceNode && targetNode) {
                const startX = (sourceNode.x - minX + padding) * minimapScale;
                const startY = (sourceNode.y - minY + padding) * minimapScale;
                const endX = (targetNode.x - minX + padding) * minimapScale;
                const endY = (targetNode.y - minY + padding) * minimapScale;
                
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
            }
        });
        ctx.stroke();
        
        // Dibujar nodos
        nodes.forEach(node => {
            const x = (node.x - minX + padding) * minimapScale;
            const y = (node.y - minY + padding) * minimapScale;
            
            // Sombra del nodo
            ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            // Fondo del nodo
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(x - 4, y - 4, 8, 8);
            
            // Resetear sombra
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        });

        // Dibujar viewport si está disponible
        if (viewportRect) {
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                viewportRect.x * minimapScale,
                viewportRect.y * minimapScale,
                viewportRect.width * minimapScale,
                viewportRect.height * minimapScale
            );
        }
    }, [nodes, connections, containerWidth, containerHeight, viewportRect]);

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
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        onViewportChange?.({ x, y });
    };

    return (
        <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-2">
            <div className="text-xs text-gray-500 mb-1 px-1">Vista General</div>
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
                <span>{Math.round(scale * 100)}%</span>
            </div>
        </div>
    );
};

export default MiniMap;