import { useState, useEffect } from 'react';
import Toolbar from './components/toolbar/Toolbar';
import ServicesSidebar from './components/sidebar/ServicesSidebar';
import Canvas from './components/canvas/Canvas';
import SettingsModal from './components/modal/SettingsModal';
import HistoryModal from './components/modal/HistoryModal';
import PreviewPanel from './components/preview/PreviewPanel';

function App() {
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
const [executionData, setExecutionData] = useState([]);
const [currentExecutingNode, setCurrentExecutingNode] = useState(null);
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
            } catch (error) {
                console.error('Error al cargar el workflow:', error);
            }
        }
    }, []);

    // Función para mostrar notificaciones
    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg ${type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    };

    // Manejadores para la Toolbar
    const handleExecute = async () => {
        const errors = validateWorkflow();
        
        if (errors.length > 0) {
            showNotification(errors[0], 'error');
            return;
        }
    
        setWorkflowConfig(prev => ({ ...prev, status: 'running' }));
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
    
        // Simular ejecución de cada nodo
        for (const node of workflowNodes) {
            setCurrentExecutingNode(node);
            
            // Actualizar estado a 'running'
            setExecutionData(prev => prev.map(n => 
                n.id === node.id ? { ...n, status: 'running' } : n
            ));
    
            // Simular procesamiento
            await new Promise(resolve => setTimeout(resolve, 1500));
    
            // Simular resultado (éxito o error)
            const success = Math.random() > 0.2;
            const duration = Math.floor(Math.random() * 1000) + 500;
    
            if (success) {
                // Simular salida según tipo de nodo
                let output;
                switch (node.type) {
                    case 'api_rest':
                        output = { status: 200, data: { message: 'Success' } };
                        break;
                    case 'database':
                        output = { rows: [{ id: 1, name: 'Test' }] };
                        break;
                    case 'email':
                        output = { sent: true, recipient: 'test@example.com' };
                        break;
                    default:
                        output = { success: true };
                }
    
                setExecutionData(prev => prev.map(n => 
                    n.id === node.id ? { 
                        ...n, 
                        status: 'success',
                        output,
                        duration 
                    } : n
                ));
            } else {
                setExecutionData(prev => prev.map(n => 
                    n.id === node.id ? { 
                        ...n, 
                        status: 'error',
                        error: 'Error en la ejecución',
                        duration 
                    } : n
                ));
                break; // Detener ejecución en caso de error
            }
        }
    
        setCurrentExecutingNode(null);
        setWorkflowConfig(prev => ({ ...prev, status: 'ready' }));
    
        // Actualizar historial
        const newExecution = {
            id: executionHistory.length + 1,
            timestamp: new Date().toISOString(),
            status: executionData.every(node => node.status === 'success') ? 'success' : 'error',
            duration: executionData.reduce((sum, node) => sum + (node.duration || 0), 0),
            nodesExecuted: workflowNodes.length
        };
        setExecutionHistory(prev => [newExecution, ...prev]);
    };

    const validateWorkflow = () => {
        const errors = [];

        // Validar que haya nodos
        if (workflowNodes.length === 0) {
            errors.push('El workflow debe tener al menos un nodo');
        }

        // Validar conexiones
        if (workflowNodes.length > 1 && workflowConnections.length === 0) {
            errors.push('Los nodos deben estar conectados');
        }

        // Validar configuración de nodos
        workflowNodes.forEach(node => {
            if (!node.config || Object.keys(node.config).length === 0) {
                errors.push(`El nodo "${node.name}" no está configurado`);
            }
        });

        return errors;
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

            showNotification('Workflow guardado correctamente');
        } catch (error) {
            console.error('Error al guardar:', error);
            showNotification('Error al guardar el workflow', 'error');
        }
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
            showNotification('Workflow importado correctamente');
        } catch (error) {
            console.error('Error al importar:', error);
            showNotification('Error al importar el workflow', 'error');
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
        showNotification('Workflow limpiado correctamente');
    };

    // Manejador para actualizaciones del Canvas
    const handleWorkflowUpdate = ({ nodes, connections }) => {
        setWorkflowNodes(nodes);
        setWorkflowConnections(connections);
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
                onSave={handleSave}
                onSettingsClick={() => setIsSettingsOpen(true)}
                onHistoryClick={() => setIsHistoryOpen(true)}
                lastSaved={workflowConfig.lastSaved}
            />
            <div className="flex-1 flex overflow-hidden">
                <ServicesSidebar />
                <div className="flex-1 flex">
                    <Canvas
                        initialNodes={workflowNodes}
                        initialConnections={workflowConnections}
                        onSave={handleWorkflowUpdate}
                    />
                    {isPreviewOpen && (
                        <PreviewPanel
                            isOpen={isPreviewOpen}
                            onClose={() => setIsPreviewOpen(false)}
                            executionData={executionData}
                            currentNode={currentExecutingNode}
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
            />
        </div>
    );
}

export default App;