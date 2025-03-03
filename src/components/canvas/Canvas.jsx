// Modificaciones en Canvas.jsx
import { useState, useRef, useEffect } from 'react';
import { Globe, Database, Mail, Undo, Redo, ZoomIn, ZoomOut, Download, Upload, Share2 } from 'lucide-react';
import ConfigPanel from '../sidebar/ConfigPanel';
import EnhancedConnection from './EnhancedConnection';
import Node from './Node';
import MiniMap from './MiniMap';
import DataPreview from '../preview/DataPreview';
import ContextMenu from './ContextMenu';
import GridBackground, { snapToGrid } from './GridBackground';
import ConnectionSettingsButton from './ConnectionSettingsButton';
import { validateConnection } from '../../config/services';
import { useHistory } from '../../hooks/useHistory';
import { validateWorkflow } from '../../utils/workflowValidator';

import {
    alignNodes,
    exportAsImage,
    exportAsJson,
    generateShareableUrl
} from '../../utils/workflowUtils';


// Importar estilos para animaciones
import '../../styles/ConnectionAnimations.css';
import { useTelegramNotifications } from '../toolbar/Notification';

const Canvas = ({ initialNodes = [], initialConnections = [], onSave }) => {
    const { success, error, info, warning } = useTelegramNotifications();

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

    // Estados para conexiones - siempre mostraremos el botón ahora
    const [connectionType, setConnectionType] = useState('curved');
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
                warning(error.message);
            });
        }
    };

    // Función auxiliar para actualizar las referencias de las conexiones
    const updateConnectionReferences = (newNodes, existingConnections) => {
        // Crear un mapa de nodos por ID para búsqueda rápida
        const nodeMap = newNodes.reduce((map, node) => {
            map[node.id] = node;
            return map;
        }, {});

        // Actualizar las referencias en las conexiones
        return existingConnections.map(conn => {
            // Saltarse conexiones inválidas
            if (!conn.startNode || !conn.endNode) {
                return conn;
            }

            const startNodeId = conn.startNode.id;
            const endNodeId = conn.endNode.id;

            // Verificar que ambos nodos existan todavía
            if (nodeMap[startNodeId] && nodeMap[endNodeId]) {
                return {
                    ...conn,
                    startNode: nodeMap[startNodeId],
                    endNode: nodeMap[endNodeId]
                };
            }

            // Si alguno de los nodos ya no existe, mantener la conexión sin cambios
            return conn;
        });
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
            success(`Nodo "${newNode.name}" creado`);
        } catch (error) {
            console.error('Error al soltar el elemento:', error);
            error('Error al crear el nodo');
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

            // Actualizar conexiones sin acumular en el historial
            const newConnections = updateConnectionReferences(newNodes, connections);

            // Actualizar estado local sin guardar en historial durante el arrastre
            setNodes(newNodes);
            setConnections(newConnections);
        }
    };

    const handleMouseUp = (e) => {
        // Finalizar arrastre de nodos y guardar en historial
        if (draggingNode) {
            updateWorkflowState(nodes, connections);
            setDraggingNode(null);
            return;
        }

        // Manejar creación de conexiones
        if (draggingConnection && draggingConnection.startNode) {
            const targetNode = nodes.find(node => {
                // Evitar conectar al mismo nodo
                if (node.id === draggingConnection.startNode.id) {
                    return false;
                }

                // Verificar si el mouse está sobre el nodo
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

            if (targetNode) {
                try {
                    // Crear una copia para evitar referencias circulares
                    const sourceNode = JSON.parse(JSON.stringify(
                        nodes.find(n => n.id === draggingConnection.startNode.id)
                    ));
                    const targetNodeCopy = JSON.parse(JSON.stringify(targetNode));

                    // Validar la conexión
                    const validation = validateConnection(sourceNode, targetNodeCopy);

                    if (validation.valid) {
                        // Crear la conexión
                        const newConnection = {
                            id: Date.now(),
                            startNode: sourceNode,
                            endNode: targetNodeCopy,
                            label: '',
                            type: connectionType
                        };

                        const newConnections = [...connections, newConnection];
                        updateWorkflowState(nodes, newConnections);
                        success('Conexión creada');
                    } else {
                        error(validation.message || 'Conexión no válida');
                    }
                } catch (err) {
                    console.error('Error al crear la conexión:', err);
                    error('Error al establecer la conexión');
                }
            }
        }

        setDraggingConnection(null);
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
        // Verificar si es una conexión
        if (connections.some(conn => conn.id === updatedNode.id)) {
            // Actualizar conexión
            const newConnections = connections.map(conn =>
                conn.id === updatedNode.id ? updatedNode : conn
            );
            updateWorkflowState(nodes, newConnections);
            setSelectedNode(updatedNode);
            success('Conexión actualizada');
        } else {
            // Actualizar nodo
            const newNodes = nodes.map(n =>
                n.id === updatedNode.id ? updatedNode : n
            );

            // Actualizar conexiones relacionadas
            const newConnections = updateConnectionReferences(newNodes, connections);

            updateWorkflowState(newNodes, newConnections);
            setSelectedNode(updatedNode);
            success('Nodo actualizado');
        }
    };

    // Acciones para nodos
    const handleNodeDelete = (nodeToDelete) => {
        // Verificar si es una conexión
        if (connections.some(conn => conn.id === nodeToDelete.id)) {
            const newConnections = connections.filter(conn => conn.id !== nodeToDelete.id);
            updateWorkflowState(nodes, newConnections);
            setSelectedNode(null);
            success('Conexión eliminada');
        } else {
            // Es un nodo, eliminar el nodo y sus conexiones
            const newConnections = connections.filter(
                conn => conn.startNode.id !== nodeToDelete.id && conn.endNode.id !== nodeToDelete.id
            );
            const newNodes = nodes.filter(node => node.id !== nodeToDelete.id);

            updateWorkflowState(newNodes, newConnections);
            setSelectedNode(null);
            success(`Nodo "${nodeToDelete.name}" eliminado`);
        }
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
        info('Nodo copiado al portapapeles');
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
        success('Nodo pegado');
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
        success(`Nodo "${node.name}" duplicado`);
    };

    const handleDeleteNodeConnections = (node) => {
        const connectionsToDelete = connections.filter(
            conn => conn.startNode.id === node.id || conn.endNode.id === node.id
        );

        if (connectionsToDelete.length === 0) {
            info('No hay conexiones para eliminar');
            return;
        }

        const newConnections = connections.filter(
            conn => conn.startNode.id !== node.id && conn.endNode.id !== node.id
        );
        updateWorkflowState(nodes, newConnections);
        info(`${connectionsToDelete.length} conexiones eliminadas`);
    };

    const handleAlignNodes = (node, direction) => {
        const newNodes = alignNodes(nodes, node, direction);
        updateWorkflowState(newNodes, connections);
        success(`Nodos alineados ${direction}`);
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
            // Utiliza transformaciones inversas para mover el canvas
            const rect = containerRef.current.getBoundingClientRect();
            const newX = (rect.width / 2) - (x * scale);
            const newY = (rect.height / 2) - (y * scale);

            setPosition({ x: newX, y: newY });
        }
    };

    // Funciones para conexiones
    const handleChangeConnectionType = (type) => {
        setConnectionType(type);

        // Si hay una conexión seleccionada, actualizar su tipo
        if (selectedNode && connections.some(c => c.id === selectedNode.id)) {
            const newConnections = connections.map(conn =>
                conn.id === selectedNode.id ? { ...conn, type } : conn
            );
            updateWorkflowState(nodes, newConnections);
            success(`Tipo de conexión cambiado a: ${type}`);
        } else {
            // Simplemente actualizar el tipo predeterminado
            info(`Tipo de conexión predeterminado: ${type}`);
        }
    };

    const handleConnectionLabelChange = (connectionId, newLabel) => {
        const newConnections = connections.map(conn =>
            conn.id === connectionId ? { ...conn, label: newLabel } : conn
        );
        updateWorkflowState(nodes, newConnections);
        success('Etiqueta de conexión actualizada');
    };

    // función de generación de URL compartible
    const handleShareUrl = () => {
        // Pasar el objeto de datos en lugar del elemento DOM
        generateShareableUrl(
            getWorkflowData(),
            (message) => success(message),
            (message) => error(message)
        );
    };

    // función de exportación a JSON o mantener la misma (si está usando la referencia al DOM)
    const handleExportJson = () => {
        // Pasar el objeto de datos en lugar del elemento DOM
        exportAsJson(
            getWorkflowData(),
            'workflow.json',
            (message) => success(message),
            (message) => error(message)
        );
    };

    // función para exportar el workflow como objeto de datos
    const getWorkflowData = () => {
        return {
            nodes,
            connections
        };
    };

    // Atajos de teclado
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignorar si el foco está en un input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // Undo/Redo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                if (e.shiftKey) {
                    if (canRedo) {
                        redo();
                        info('Acción rehecha');
                    }
                } else {
                    if (canUndo) {
                        undo();
                        info('Acción deshecha');
                    }
                }
                e.preventDefault();
            }

            // Delete
            if (e.key === 'Delete' && selectedNode) {
                handleNodeDelete(selectedNode);
                e.preventDefault();
            }

            // Copy/Paste
            if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedNode) {
                handleCopyNode(selectedNode);
                e.preventDefault();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedNode) {
                handlePasteNode(copiedNode);
                e.preventDefault();
            }

            // Toggle Grid
            if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
                setShowGrid(!showGrid);
                info(`Cuadrícula ${showGrid ? 'oculta' : 'visible'}`);
                e.preventDefault();
            }

            // Toggle Snap to Grid
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'g') {
                setSnapToGridEnabled(!snapToGridEnabled);
                info(`Snap to grid ${snapToGridEnabled ? 'desactivado' : 'activado'}`);
                e.preventDefault();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        canUndo, canRedo, undo, redo, selectedNode,
        copiedNode, showGrid, snapToGridEnabled,
        success, error, info, warning
    ]);

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
                {showGrid && (
                    <GridBackground
                        gridSize={20}
                        showMainLines={true}
                        mainLineEvery={5}
                        gridColor="rgba(200, 200, 200, 0.2)"
                        mainLineColor="rgba(180, 180, 180, 0.3)"
                    />
                )}

                {/* Toolbar principal */}
                <div className="absolute top-4 left-4 flex gap-2 z-30">
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
                <div className="absolute top-4 right-4 flex gap-2 z-30">
                    <button
                        onClick={() => exportAsImage(
                            containerRef.current,
                            'workflow.png',
                            (message) => success(message),
                            (message) => error(message)
                        )}
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
                        <Download size={20} className="text-gray-600" />
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
                    {/* Conexiones existentes - Usar EnhancedConnection */}
                    <svg className="absolute inset-0 w-full h-full overflow-visible">
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

                {/* Botón de configuración de conexiones siempre visible */}
                <ConnectionSettingsButton
                    currentType={connectionType}
                    showAnimation={showFlowAnimation}
                    onTypeChange={handleChangeConnectionType}
                    onToggleAnimation={() => {
                        setShowFlowAnimation(!showFlowAnimation);
                        info(`Animación de flujo ${!showFlowAnimation ? 'activada' : 'desactivada'}`);
                    }}
                />

                {/* Mini-mapa - posición mejorada */}
                <MiniMap
                    nodes={nodes}
                    connections={connections}
                    scale={scale}
                    position={position}
                    onViewportChange={handleViewportChange}
                    containerWidth={180}
                    containerHeight={120}
                />

                {/* Vista previa de datos (posicionamiento mejorado) */}
                {showDataPreview && selectedNode && !connections.some(c => c.id === selectedNode.id) && (
                    <div className="absolute bottom-40 left-4 z-20 max-w-md">
                        <DataPreview
                            nodeId={selectedNode.id}
                            data={selectedNode.config}
                            isLoading={false}
                        />
                    </div>
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

            {/* Panel de configuración con posición fija */}
            {selectedNode && (
                <div className="w-80 border-l bg-white overflow-auto z-20">
                    <ConfigPanel
                        node={selectedNode}
                        connections={connections}
                        onUpdate={handleNodeUpdate}
                        onClose={() => setSelectedNode(null)}
                        onDelete={() => handleNodeDelete(selectedNode)}
                    />
                </div>
            )}
        </div>
    );
};

export default Canvas;