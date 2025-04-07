// App.js modificado con integración de nuevos servicios
import { useState, useEffect, useRef } from 'react';
import Toolbar from './components/toolbar/Toolbar';
import ServicesSidebar from './components/sidebar/ServicesSidebar';
import Canvas from './components/canvas/Canvas';
import SettingsModal from './components/modal/SettingsModal';
import HistoryModal from './components/modal/HistoryModal';
// Reemplazamos la importación directa del PreviewPanel
// import PreviewPanel from './components/preview/PreviewPanel';
// Y en su lugar importamos el ExecutionController que a su vez usa el PreviewPanel mejorado
import ExecutionController from './components/preview/ExecutionController';

import { useTelegramNotifications } from './components/toolbar/Notification';
import { exportAsImage, exportAsJson } from './utils/workflowUtils';

// Importar nuevos servicios
import { WorkflowProvider, useWorkflow } from './services/WorkflowContext';
import { ExecutionManager } from './services/executionManager';


// Wrapper principal que proporciona el contexto
function WorkflowApp() {
    return (
        <WorkflowProvider>
            <App />
        </WorkflowProvider>
    );
}

function App() {
    // Acceder al contexto de workflow
    const {
        executeWorkflow,
        cancelExecution,
        isExecuting,
        progress,
        activeNodeId,
        executionResults,
        executionLog,
        error: workflowError,
        validateWorkflow: validateWorkflowContext,
        clearExecutionResults
    } = useWorkflow();

    // Sistema de notificaciones estilo Telegram
    const {
        success,
        error,
        info,
        warning,
        NotificationBell
    } = useTelegramNotifications();

    // Estados para el workflow
    const [workflowNodes, setWorkflowNodes] = useState([]);
    const [workflowConnections, setWorkflowConnections] = useState([]);
    const [workflowConfig, setWorkflowConfig] = useState({
        name: 'Nuevo Workflow',
        interval: '15m',
        status: 'ready', // ready, running, error
        lastSaved: null,
        notifications: {
            onSuccess: true,
            onError: true
        }
    });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [executionHistory, setExecutionHistory] = useState([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    // Mantener estos estados para compatibilidad con el código existente
    const [executionData, setExecutionData] = useState([]);
    const [currentExecutingNode, setCurrentExecutingNode] = useState(null);
    const canvasRef = useRef(null);

    // Execution manager para operaciones avanzadas
    const executionManagerRef = useRef(null);

    // ID único para el workflow actual
    const [workflowId, setWorkflowId] = useState(`workflow_${Date.now()}`);

    // Inicializar execution manager
    useEffect(() => {
        if (!executionManagerRef.current) {
            executionManagerRef.current = new ExecutionManager();
        }
    }, []);

    // Cargar workflow guardado al iniciar
    useEffect(() => {
        const savedWorkflow = localStorage.getItem('current-workflow');
        if (savedWorkflow) {
            try {
                const { nodes, connections, config } = JSON.parse(savedWorkflow);
                setWorkflowNodes(nodes || []);
                setWorkflowConnections(connections || []);
                if (config) {
                    setWorkflowConfig(prev => ({
                        ...prev,
                        ...config,
                        status: 'ready'
                    }));
                }
                info('Workflow cargado correctamente');
            } catch (error) {
                console.error('Error al cargar el workflow:', error);
                error('Error al cargar el workflow guardado');
            }
        }
    }, []);

    // Efectos para actualizar la UI basado en estado de ejecución
    useEffect(() => {
        if (isExecuting) {
            setWorkflowConfig(prev => ({ ...prev, status: 'running' }));
        } else {
            setWorkflowConfig(prev => ({ ...prev, status: 'ready' }));
        }
    }, [isExecuting]);

    // Efecto para manejar nodo activo durante ejecución
    useEffect(() => {
        setCurrentExecutingNode(
            workflowNodes.find(node => node.id === activeNodeId) || null
        );
    }, [activeNodeId, workflowNodes]);

    // Efecto para actualizar datos de ejecución cuando cambian los resultados
    useEffect(() => {
        if (executionResults && Object.keys(executionResults).length > 0) {
            const updatedExecutionData = workflowNodes.map(node => {
                const nodeResult = executionResults[node.id];
                const nodeLog = executionLog.filter(log => log.nodeId === node.id);
                const lastLog = nodeLog[nodeLog.length - 1];

                let status = 'pending';
                if (lastLog) {
                    if (lastLog.status === 'COMPLETED') status = 'success';
                    else if (lastLog.status === 'ERROR') status = 'error';
                    else if (lastLog.status === 'STARTED') status = 'running';
                }

                return {
                    ...node,
                    status,
                    output: nodeResult || null,
                    error: lastLog?.error || null,
                    duration: lastLog?.duration || null
                };
            });

            setExecutionData(updatedExecutionData);
        }
    }, [executionResults, executionLog, workflowNodes]);

    // Efecto para mostrar errores de workflow
    useEffect(() => {
        if (workflowError) {
            error(`Error en el workflow: ${workflowError}`);
        }
    }, [workflowError]);

    // Manejadores para la Toolbar
    const handleExecute = async () => {
        // Validar workflow usando nuestro propio validador
        const validationResult = validateWorkflow();

        if (validationResult.errors.length > 0) {
            warning(validationResult.errors[0]);
            return;
        }

        // Abrir panel de preview
        setIsPreviewOpen(true);

        // Inicializar datos de ejecución
        const initialExecutionData = workflowNodes.map(node => ({
            ...node,
            status: 'pending',
            output: null,
            error: null,
            duration: null
        }));
        setExecutionData(initialExecutionData);

        // Limpiar resultados anteriores
        clearExecutionResults();

        // Adaptar los nodos a la estructura esperada por WorkflowContext
        const adaptedNodes = workflowNodes.map(node => ({
            id: node.id,
            type: node.service?.id,
            data: {
                label: node.name,
                config: node.config || {}
            }
        }));

        console.log("Nodos adaptados:", adaptedNodes);

        // Adaptar conexiones si es necesario
        const adaptedConnections = workflowConnections;

        // Iniciar tiempo para medición
        const startTime = Date.now();

        try {
            // Ejecutar workflow usando el execution manager
            const results = await executionManagerRef.current.executeWorkflow({
                nodes: adaptedNodes,
                edges: workflowConnections
            }, { initialInputs: {} });

            // Calcular duración total
            const totalDuration = Date.now() - startTime;

            // Actualizar historial
            const newExecution = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                status: results.success ? 'success' : 'error',
                duration: totalDuration,
                nodesExecuted: Object.keys(results.results || {}).length,
                nodes: Object.entries(results.status || {}).map(([id, status]) => {
                    const node = workflowNodes.find(n => n.id === id);
                    return {
                        id,
                        name: node?.name || id,
                        status: status === 'completed' ? 'success' : status,
                        duration: results.nodeDurations?.[id] || 0
                    };
                })
            };

            setExecutionHistory(prev => [newExecution, ...prev]);

            if (results.success) {
                success('Workflow ejecutado correctamente');
            } else {
                warning('Workflow finalizado con errores');
            }
        } catch (err) {
            error(`Error al ejecutar workflow: ${err.message}`);

            // Actualizar historial con error
            const newExecution = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                status: 'error',
                duration: Date.now() - startTime,
                error: err.message,
                nodesExecuted: 0,
                nodes: []
            };

            setExecutionHistory(prev => [newExecution, ...prev]);
        }
    };
    const validateWorkflow = () => {
        const errors = [];
        const warnings = [];

        // Validar que haya nodos
        if (workflowNodes.length === 0) {
            errors.push('El workflow debe tener al menos un nodo');
            return { valid: false, errors, warnings };
        }

        // Validar conexiones
        if (workflowNodes.length > 1 && workflowConnections.length === 0) {
            errors.push('Los nodos deben estar conectados');
        }

        // Validar configuración de nodos - adaptado a tu estructura real
        workflowNodes.forEach(node => {
            if (!node.config || Object.keys(node.config || {}).length === 0) {
                errors.push(`El nodo "${node.name || node.id}" no está configurado`);
            }

            // Validaciones específicas por tipo
            const nodeType = node.service?.id;
            if (nodeType === 'api_rest') {
                if (!node.config?.url) {
                    errors.push(`El nodo "${node.name || node.id}" debe tener una URL configurada`);
                }

                // Validar método HTTP
                if (!node.config?.method) {
                    warnings.push(`El nodo "${node.name || node.id}" no tiene un método HTTP configurado, se usará GET por defecto`);
                }
            } else if (nodeType === 'database') {
                if (!node.config?.query) {
                    errors.push(`El nodo "${node.name || node.id}" debe tener una consulta configurada`);
                }
            } else if (nodeType === 'email') {
                if (!node.config?.to) {
                    errors.push(`El nodo "${node.name || node.id}" debe tener un destinatario configurado`);
                }
                if (!node.config?.subject) {
                    warnings.push(`El nodo "${node.name || node.id}" no tiene asunto configurado`);
                }
            }
        });

        // Usar también la validación del contexto
        try {
            // Adaptar los nodos para la validación del contexto
            const adaptedNodesForValidation = workflowNodes.map(node => ({
                id: node.id,
                type: node.service?.id,
                data: {
                    label: node.name,
                    config: node.config || {}
                }
            }));

            const contextValidation = validateWorkflowContext(adaptedNodesForValidation, workflowConnections);
            if (!contextValidation.valid) {
                contextValidation.issues.forEach(issue => {
                    if (issue.type === 'error') {
                        errors.push(issue.message);
                    } else if (issue.type === 'warning') {
                        warnings.push(issue.message);
                    }
                });
            }
        } catch (e) {
            console.error('Error en validación avanzada:', e);
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    };

    const handleSave = () => {
        try {
            const workflow = {
                nodes: workflowNodes,
                connections: workflowConnections,
                config: {
                    ...workflowConfig,
                    lastSaved: new Date().toISOString()
                }
            };
            localStorage.setItem('current-workflow', JSON.stringify(workflow));

            setWorkflowConfig(prev => ({
                ...prev,
                lastSaved: new Date().toISOString()
            }));

            success('Workflow guardado correctamente');
        } catch (error) {
            console.error('Error al guardar:', error);
            error('Error al guardar el workflow');
        }
    };

    // Cancelar ejecución
    const handleCancelExecution = () => {
        cancelExecution();
        warning('Ejecución del workflow cancelada');
    };

    // Exportar como imagen
    const handleExportImage = () => {
        // La función exportAsImage recibe ahora los callbacks directamente
        exportAsImage(
            null, // No necesitamos pasar el elemento DOM
            `${workflowConfig.name.replace(/\s+/g, '_')}.png`,
            (message) => success(message),
            (message) => error(message)
        );
    };

    // Exportar como JSON
    const handleExportJson = () => {
        const workflowData = {
            nodes: workflowNodes,
            connections: workflowConnections,
            config: {
                name: workflowConfig.name,
                createdAt: workflowConfig.createdAt || new Date().toISOString(),
                lastSaved: new Date().toISOString()
            }
        };

        exportAsJson(
            workflowData,
            `${workflowConfig.name.replace(/\s+/g, '_')}.json`,
            (message) => success(message),
            (message) => error(message)
        );
    };

    // Manejadores para el SettingsModal
    const handleImport = (importedWorkflow) => {
        try {
            setWorkflowNodes(importedWorkflow.nodes || []);
            setWorkflowConnections(importedWorkflow.connections || []);
            if (importedWorkflow.config) {
                setWorkflowConfig(prev => ({
                    ...prev,
                    ...importedWorkflow.config,
                    status: 'ready'
                }));
            }
            handleSave();
            setIsSettingsOpen(false);
            success('Workflow importado correctamente');
        } catch (error) {
            console.error('Error al importar:', error);
            error('Error al importar el workflow');
        }
    };

    const handleClear = () => {
        setWorkflowNodes([]);
        setWorkflowConnections([]);
        setWorkflowConfig(prev => ({
            ...prev,
            name: 'Nuevo Workflow',
            lastSaved: null
        }));
        localStorage.removeItem('current-workflow');
        setIsSettingsOpen(false);
        info('Workflow limpiado correctamente');
    };

    // Manejador para actualizaciones del Canvas
    const handleWorkflowUpdate = ({ nodes, connections }) => {
        setWorkflowNodes(nodes);
        setWorkflowConnections(connections);
    };

    // Prueba de conexión a API para un nodo específico
    const handleTestApiConnection = async (node) => {
        if (!node || node.type !== 'api_rest' || !node.data?.config?.url) {
            warning('No es posible probar este nodo. Asegúrate de que sea una API y tenga una URL configurada');
            return;
        }

        info(`Probando conexión a ${node.data.config.url}...`);

        try {
            const result = await executionManagerRef.current.executeNode(node, {});

            if (result.error) {
                error(`Error al conectar con API: ${result.message || 'Error desconocido'}`);
                return false;
            }

            success(`Conexión exitosa a ${node.data.config.url}`);
            return true;
        } catch (err) {
            error(`Error al probar conexión: ${err.message}`);
            return false;
        }
    };

    return (
        <div className="h-screen flex flex-col">
            <Toolbar
                name={workflowConfig.name}
                status={workflowConfig.status}
                interval={workflowConfig.interval}
                onIntervalChange={(interval) =>
                    setWorkflowConfig(prev => ({ ...prev, interval }))
                }
                onExecute={handleExecute}
                onCancelExecution={handleCancelExecution}
                isExecuting={isExecuting}
                progress={progress}
                onSave={handleSave}
                onSettingsClick={() => setIsSettingsOpen(true)}
                onHistoryClick={() => setIsHistoryOpen(true)}
                lastSaved={workflowConfig.lastSaved}
                notificationBell={<NotificationBell />}
            />
            <div className="flex-1 flex overflow-hidden">
                <ServicesSidebar
                    onTestApiConnection={handleTestApiConnection}
                />
                <div className="flex-1 flex">
                    {/* <Canvas
                        ref={canvasRef}
                        initialNodes={workflowNodes}
                        initialConnections={workflowConnections}
                        onSave={handleWorkflowUpdate}
                        onExportImage={handleExportImage}
                        onExportJson={handleExportJson}
                        activeNodeId={activeNodeId}
                        executionStatus={executionResults ?
                            Object.entries(executionResults).reduce((acc, [id, result]) => {
                                acc[id] = result?.error ? 'error' : 'success';
                                return acc;
                            }, {}) : {}
                        }
                    /> */}
                    <Canvas
                        initialNodes={workflowNodes}
                        initialConnections={workflowConnections}
                        onSave={handleWorkflowUpdate}
                        onExportImage={handleExportImage}
                        onExportJson={handleExportJson}
                        activeNodeId={activeNodeId}
                        executionStatus={executionResults ?
                            Object.entries(executionResults).reduce((acc, [id, result]) => {
                                acc[id] = result?.error ? 'error' : 'success';
                                return acc;
                            }, {}) : {}
                        }
                    />
                    {/* Reemplazamos el antiguo PreviewPanel con nuestro nuevo ExecutionController */}
                    {isPreviewOpen && (
                        <ExecutionController
                            workflowId={workflowId}
                            executionManager={executionManagerRef.current}
                            isOpen={isPreviewOpen}
                            onClose={() => setIsPreviewOpen(false)}
                            // Opcional: Para mantener compatibilidad con el código existente
                            initialExecutionData={executionData}
                        />
                    )}
                </div>
            </div>
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                config={workflowConfig}
                onSave={(newConfig) => {
                    setWorkflowConfig(newConfig);
                    handleSave();
                }}
                onImport={handleImport}
                onClear={handleClear}
            />
            <HistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                history={executionHistory}
                onRunAgain={handleExecute}
            />
        </div>
    );
}

export default WorkflowApp;