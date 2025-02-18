import { useState, useRef, useEffect } from 'react';
import { Globe, Database, Mail, Undo, Redo, Trash2, ZoomIn, ZoomOut, Download, Upload, Share2 } from 'lucide-react';
import ConfigPanel from '../sidebar/ConfigPanel';
import Connection from './Connection';
import EnhancedConnection from './EnhancedConnection';
import Node from './Node';
import MiniMap from './MiniMap';
import DataPreview from '../preview/DataPreview';
import ContextMenu from './ContextMenu';
import GridBackground, { snapToGrid } from './GridBackground';
import { validateConnection } from '../../config/services';
import { useHistory } from '../../hooks/useHistory';
import { validateWorkflow } from '../../utils/workflowValidator';
import {
    exportAsImage,
    exportAsJson,
    importFromJson,
    generateShareableUrl,
    alignNodes,
    distributeNodes
} from '../../utils/workflowUtils';

const Canvas = ({ initialNodes = [], initialConnections = [], onSave }) => {
    // Sistema de historial
    const {
        state: historyState,
        set: setHistoryState,
        undo,
        redo,
        canUndo,
        canRedo
    } = useHistory({ nodes: initialNodes, connections: initialConnections });

    // Estados principales
    const [nodes, setNodes] = useState(historyState.nodes);
    const [connections, setConnections] = useState(historyState.connections);
    const [selectedNode, setSelectedNode] = useState(null);
    const [draggingNode, setDraggingNode] = useState(null);
    const [draggingConnection, setDraggingConnection] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [showDataPreview, setShowDataPreview] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    // Estados para zoom y posición
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    // Estados para menú contextual y cuadrícula
    const [contextMenu, setContextMenu] = useState(null);
    const [showGrid, setShowGrid] = useState(true);
    const [snapToGridEnabled, setSnapToGridEnabled] = useState(true);
    const [copiedNode, setCopiedNode] = useState(null);
    const [connectionType, setConnectionType] = useState(EnhancedConnection.Types.CURVED);
    const [showFlowAnimation, setShowFlowAnimation] = useState(false);

    // Sincronización del estado con el historial
    useEffect(() => {
        setNodes(historyState.nodes);
        setConnections(historyState.connections);
    }, [historyState]);

    // Actualizar estado y notificar cambios
    const updateWorkflowState = (newNodes, newConnections) => {
        setHistoryState({ nodes: newNodes, connections: newConnections });
        notifyChanges(newNodes, newConnections);
    };

    const notifyChanges = (newNodes, newConnections) => {
        onSave?.({
            nodes: newNodes || nodes,
            connections: newConnections || connections
        });

        // Validar el workflow
        const validation = validateWorkflow(newNodes || nodes, newConnections || connections);
        if (!validation.isValid) {
            validation.errors.forEach(error => {
                const notification = document.createElement('div');
                notification.className = 'fixed bottom-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-md shadow-lg';
                notification.textContent = error.message;
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 3000);
            });
        }
    };

    // Manejadores de eventos
    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (draggingNode) return;

        try {
            const service = JSON.parse(e.dataTransfer.getData('application/json'));
            const rect = e.currentTarget.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;

            // Aplicar snap-to-grid si está habilitado
            if (snapToGridEnabled) {
                const snapped = snapToGrid({ x, y });
                x = snapped.x;
                y = snapped.y;
            }

            const newNode = {
                id: Date.now(),
                type: service.id,
                name: `${service.name} ${nodes.length + 1}`,
                x,
                y,
                service,
                config: {},
                number: nodes.length + 1
            };

            const newNodes = [...nodes, newNode];
            updateWorkflowState(newNodes, connections);
        } catch (error) {
            console.error('Error al soltar el elemento:', error);
        }
    };

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setMousePosition({ x, y });

        if (draggingNode) {
            let newX = x - dragOffset.current.x;
            let newY = y - dragOffset.current.y;

            // Aplicar snap-to-grid si está habilitado
            if (snapToGridEnabled) {
                const snapped = snapToGrid({ x: newX, y: newY });
                newX = snapped.x;
                newY = snapped.y;
            }

            const newNodes = nodes.map(node =>
                node.id === draggingNode.id
                    ? { ...node, x: newX, y: newY }
                    : node
            );

            const newConnections = connections.map(conn => {
                if (conn.startNode.id === draggingNode.id) {
                    return {
                        ...conn,
                        startNode: { ...conn.startNode, x: newX, y: newY }
                    };
                }
                if (conn.endNode.id === draggingNode.id) {
                    return {
                        ...conn,
                        endNode: { ...conn.endNode, x: newX, y: newY }
                    };
                }
                return conn;
            });

            updateWorkflowState(newNodes, newConnections);
        }
    };

    const handleMouseUp = (e) => {
        if (draggingConnection && draggingConnection.startNode) {
            const targetNode = nodes.find(node => {
                const nodeRect = {
                    left: node.x,
                    right: node.x + 256,
                    top: node.y,
                    bottom: node.y + 64
                };
                return mousePosition.x >= nodeRect.left &&
                    mousePosition.x <= nodeRect.right &&
                    mousePosition.y >= nodeRect.top &&
                    mousePosition.y <= nodeRect.bottom;
            });

            if (targetNode && draggingConnection.startNode.id !== targetNode.id) {
                const validation = validateConnection(draggingConnection.startNode, targetNode);

                if (validation.valid) {
                    const newConnection = {
                        id: Date.now(),
                        startNode: draggingConnection.startNode,
                        endNode: targetNode,
                        label: '',
                        type: connectionType
                    };
                    const newConnections = [...connections, newConnection];
                    updateWorkflowState(nodes, newConnections);
                } else {
                    const notification = document.createElement('div');
                    notification.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg';
                    notification.textContent = validation.message;
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 3000);
                }
            }
        }
        setDraggingConnection(null);
        setDraggingNode(null);
    };

    const handleNodeClick = (e, node) => {
        e.stopPropagation();
        setSelectedNode(node);
        setShowDataPreview(true);
    };

    const handleNodeMouseDown = (e, node) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        setDraggingNode(node);
    };

    const handleConnectorMouseDown = (e, node, type) => {
        e.stopPropagation();
        setDraggingConnection({
            startNode: type === 'output' ? node : null,
            endNode: type === 'input' ? node : null,
        });
    };

    const handleConnectionClick = (connection) => {
        setSelectedNode(connection);
    };

    const handleNodeUpdate = (updatedNode) => {
        const newNodes = nodes.map(n =>
            n.id === updatedNode.id ? updatedNode : n
        );
        updateWorkflowState(newNodes, connections);
        setSelectedNode(updatedNode);
    };

    // Acciones para nodos
    const handleNodeDelete = (nodeToDelete) => {
        const newConnections = connections.filter(
            conn => conn.startNode.id !== nodeToDelete.id && conn.endNode.id !== nodeToDelete.id
        );
        const newNodes = nodes.filter(node => node.id !== nodeToDelete.id);

        updateWorkflowState(newNodes, newConnections);
        setSelectedNode(null);

        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg';
        notification.textContent = `Nodo "${nodeToDelete.name}" eliminado`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    };

    // Funciones para el menú contextual
    const handleContextMenu = (e, node) => {
        e.preventDefault();
        if (!node) return;

        const rect = containerRef.current.getBoundingClientRect();
        setContextMenu({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            node
        });
    };

    const handleCopyNode = (node) => {
        setCopiedNode({ ...node, id: null });
    };

    const handlePasteNode = (nodeToPaste) => {
        if (!nodeToPaste) return;

        // Generar posición si no hay contexto de menú
        let posX = mousePosition.x;
        let posY = mousePosition.y;

        if (contextMenu) {
            posX = contextMenu.x;
            posY = contextMenu.y;
        }

        const newNode = {
            ...nodeToPaste,
            id: Date.now(),
            x: posX,
            y: posY,
            name: `${nodeToPaste.name} (copia)`
        };

        const newNodes = [...nodes, newNode];
        updateWorkflowState(newNodes, connections);
    };

    const handleDuplicateNode = (node) => {
        const duplicatedNode = {
            ...node,
            id: Date.now(),
            x: node.x + 30,
            y: node.y + 30,
            name: `${node.name} (copia)`
        };

        const newNodes = [...nodes, duplicatedNode];
        updateWorkflowState(newNodes, connections);
    };

    const handleDeleteNodeConnections = (node) => {
        const newConnections = connections.filter(
            conn => conn.startNode.id !== node.id && conn.endNode.id !== node.id
        );
        updateWorkflowState(nodes, newConnections);
    };

    const handleAlignNodes = (node, direction) => {
        const newNodes = alignNodes(nodes, node, direction);
        updateWorkflowState(newNodes, connections);
    };

    // Funciones para el zoom
    const handleZoom = (delta) => {
        setScale(prevScale => {
            const newScale = prevScale + delta;
            return Math.min(Math.max(0.5, newScale), 2);
        });
    };

    const handleViewportChange = ({ x, y }) => {
        if (containerRef.current) {
            // Ajusta estos cálculos según sea necesario
            const rect = containerRef.current.getBoundingClientRect();
            // Utiliza transformaciones inversas para mover el canvas
            const newX = (rect.width / 2) - (x * scale);
            const newY = (rect.height / 2) - (y * scale);

            console.log('Moviendo viewport a:', newX, newY);
            setPosition({ x: newX, y: newY });
        }
    };

    // Funciones para exportación/importación
    const handleExportImage = () => {
        exportAsImage(containerRef.current, 'workflow.png');
    };

    const handleExportJson = () => {
        exportAsJson({ nodes, connections }, 'workflow.json');
    };

    const handleShareUrl = () => {
        // Usa window.location.origin para obtener la base de la URL
        const baseUrl = window.location.origin + window.location.pathname;
        const workflowData = { nodes, connections };

        try {
            const jsonStr = JSON.stringify(workflowData);
            const encoded = btoa(encodeURIComponent(jsonStr));
            const url = `${baseUrl}?workflow=${encoded}`;

            navigator.clipboard.writeText(url);
            // Mostrar notificación...
        } catch (error) {
            console.error('Error al generar URL:', error);
            // Mostrar error...
        }
    };

    const handleConnectionLabelChange = (connectionId, newLabel) => {
        const newConnections = connections.map(conn =>
            conn.id === connectionId ? { ...conn, label: newLabel } : conn
        );
        updateWorkflowState(nodes, newConnections);
    };

    const handleChangeConnectionType = (type) => {
        setConnectionType(type);

        // Actualizar conexiones existentes si se desea
        if (selectedNode && connections.some(c => c.id === selectedNode.id)) {
            const newConnections = connections.map(conn =>
                conn.id === selectedNode.id ? { ...conn, type } : conn
            );
            updateWorkflowState(nodes, newConnections);
        }
    };

    // Atajos de teclado
    useEffect(() => {
        const handleKeyDown = (e) => {
            console.log('Tecla presionada:', e.key, 'Ctrl:', e.ctrlKey, 'Shift:', e.shiftKey);

            // Asegúrate de que el foco esté en el canvas
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // Undo/Redo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                if (e.shiftKey) {
                    if (canRedo) {
                        console.log('Ejecutando REDO');
                        redo();
                    }
                } else {
                    if (canUndo) {
                        console.log('Ejecutando UNDO');
                        undo();
                    }
                }
                e.preventDefault();
            }

            // Copy/Paste
            if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedNode) {
                console.log('Copiando nodo:', selectedNode.id);
                handleCopyNode(selectedNode);
                e.preventDefault();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedNode) {
                console.log('Pegando nodo copiado');
                handlePasteNode(copiedNode);
                e.preventDefault();
            }

            // Grid visibility
            if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
                console.log('Alternando visibilidad de cuadrícula');
                setShowGrid(!showGrid);
                e.preventDefault();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canUndo, canRedo, undo, redo, selectedNode, copiedNode, showGrid, snapToGridEnabled]);
    return (
        <div className="flex-1 flex">
            <div
                ref={containerRef}
                className="flex-1 bg-gray-50 relative overflow-hidden"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={() => setSelectedNode(null)}
                onContextMenu={(e) => handleContextMenu(e, null)}
            >
                {/* Cuadrícula de fondo */}
                {showGrid && console.log('Mostrando cuadrícula') && (
                    <GridBackground
                        gridSize={20}
                        showMainLines={true}
                        mainLineEvery={5}
                    />
                )}

                {/* Toolbar principal */}
                <div className="absolute top-4 left-4 flex gap-2 z-10">
                    <button
                        onClick={undo}
                        disabled={!canUndo}
                        className={`p-2 rounded ${canUndo ? 'bg-white hover:bg-gray-100' : 'bg-gray-200'} shadow`}
                        title="Deshacer (Ctrl+Z)"
                    >
                        <Undo size={20} className={canUndo ? 'text-gray-600' : 'text-gray-400'} />
                    </button>
                    <button
                        onClick={redo}
                        disabled={!canRedo}
                        className={`p-2 rounded ${canRedo ? 'bg-white hover:bg-gray-100' : 'bg-gray-200'} shadow`}
                        title="Rehacer (Ctrl+Shift+Z)"
                    >
                        <Redo size={20} className={canRedo ? 'text-gray-600' : 'text-gray-400'} />
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    <button
                        onClick={() => handleZoom(0.1)}
                        className="p-2 rounded bg-white hover:bg-gray-100 shadow"
                        title="Acercar"
                    >
                        <ZoomIn size={20} className="text-gray-600" />
                    </button>
                    <button
                        onClick={() => handleZoom(-0.1)}
                        className="p-2 rounded bg-white hover:bg-gray-100 shadow"
                        title="Alejar"
                    >
                        <ZoomOut size={20} className="text-gray-600" />
                    </button>
                </div>

                {/* Toolbar secundaria */}
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                    <button
                        onClick={handleExportImage}
                        className="p-2 rounded bg-white hover:bg-gray-100 shadow"
                        title="Exportar como imagen"
                    >
                        <Download size={20} className="text-gray-600" />
                    </button>
                    <button
                        onClick={handleExportJson}
                        className="p-2 rounded bg-white hover:bg-gray-100 shadow"
                        title="Exportar como JSON"
                    >
                        <Upload size={20} className="text-gray-600" />
                    </button>
                    <button
                        onClick={handleShareUrl}
                        className="p-2 rounded bg-white hover:bg-gray-100 shadow"
                        title="Compartir URL"
                    >
                        <Share2 size={20} className="text-gray-600" />
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    <button
                        onClick={() => setShowGrid(!showGrid)}
                        className={`p-2 rounded ${showGrid ? 'bg-blue-100 hover:bg-blue-200' : 'bg-white hover:bg-gray-100'} shadow`}
                        title="Mostrar/ocultar cuadrícula (Ctrl+G)"
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" className="text-gray-600">
                            <path
                                fill="currentColor"
                                d="M20 3H4c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2zM4 19V5h16l.001 14H4z"
                            />
                            <path
                                fill="currentColor"
                                d="M8 7v10h2V7zm6 0v10h2V7z"
                            />
                            <path
                                fill="currentColor"
                                d="M4 11h16v2H4z"
                            />
                        </svg>
                    </button>
                    <button
                        onClick={() => setSnapToGridEnabled(!snapToGridEnabled)}
                        className={`p-2 rounded ${snapToGridEnabled ? 'bg-blue-100 hover:bg-blue-200' : 'bg-white hover:bg-gray-100'} shadow`}
                        title="Activar/desactivar snap a cuadrícula (Ctrl+Shift+G)"
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" className="text-gray-600">
                            <path
                                fill="currentColor"
                                d="M20 3h-4V1h-2v2h-4V1H8v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"
                            />
                            <path
                                fill="currentColor"
                                d="M7 10h10v2H7zm0 4h7v2H7z"
                            />
                        </svg>
                    </button>
                </div>

                {/* Contenedor transformable */}
                <div
                    style={{
                        transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                        transformOrigin: 'center',
                        transition: 'transform 0.1s ease-out',
                        position: 'absolute',
                        width: '100%',
                        height: '100%'
                    }}
                >
                    {/* Conexiones existentes - Usar EnhancedConnection si está implementado */}
                    <svg className="absolute inset-0 w-full h-full">
                        {connections.map((connection) => (
                            <EnhancedConnection
                                key={connection.id}
                                startNode={connection.startNode}
                                endNode={connection.endNode}
                                isSelected={selectedNode === connection}
                                isValid={validateConnection(connection.startNode, connection.endNode).valid}
                                type={connection.type || connectionType}
                                label={connection.label || ''}
                                flowAnimation={showFlowAnimation}
                                onClick={() => handleConnectionClick(connection)}
                                onLabelChange={(newLabel) => handleConnectionLabelChange(connection.id, newLabel)}
                            />
                        ))}

                        {/* Conexión en proceso de arrastre */}
                        {draggingConnection && draggingConnection.startNode && (
                            <EnhancedConnection
                                startNode={draggingConnection.startNode}
                                endNode={{
                                    x: mousePosition.x,
                                    y: mousePosition.y
                                }}
                                isDragging={true}
                                isValid={true}
                                type={connectionType}
                            />
                        )}
                    </svg>

                    {/* Nodos */}
                    {nodes.map(node => (
                        <Node
                            key={node.id}
                            node={node}
                            isSelected={selectedNode?.id === node.id}
                            onClick={handleNodeClick}
                            onMouseDown={handleNodeMouseDown}
                            onConnectorMouseDown={handleConnectorMouseDown}
                            draggingConnection={draggingConnection}
                            onDelete={() => handleNodeDelete(node)}
                            onContextMenu={handleContextMenu}
                        />
                    ))}
                </div>

                {/* Mini-mapa */}
                <MiniMap
                    nodes={nodes}
                    connections={connections}
                    scale={scale}
                    onViewportChange={handleViewportChange}
                />

                {/* Vista previa de datos */}
                {showDataPreview && selectedNode && (
                    <DataPreview
                        nodeId={selectedNode.id}
                        data={selectedNode.config}
                        isLoading={false}
                    />
                )}

                {/* Menú contextual */}
                {contextMenu && (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        node={contextMenu.node}
                        connections={connections.filter(
                            conn => contextMenu.node && (conn.startNode.id === contextMenu.node.id || conn.endNode.id === contextMenu.node.id)
                        )}
                        onClose={() => setContextMenu(null)}
                        onCopy={handleCopyNode}
                        onPaste={handlePasteNode}
                        onDuplicate={handleDuplicateNode}
                        onDelete={handleNodeDelete}
                        onDeleteConnections={handleDeleteNodeConnections}
                        onAlign={handleAlignNodes}
                        showGrid={showGrid}
                        onToggleGrid={() => setShowGrid(!showGrid)}
                    />
                )}
            </div>

            {/* Panel de configuración */}
            {selectedNode && (
                <ConfigPanel
                    node={selectedNode}
                    onUpdate={handleNodeUpdate}
                    onClose={() => setSelectedNode(null)}
                    onDelete={() => handleNodeDelete(selectedNode)}
                />
            )}
        </div>
    );
};

export default Canvas;