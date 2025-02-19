// // import { useState, useEffect } from 'react';
// // import Toolbar from './components/toolbar/Toolbar';
// // import ServicesSidebar from './components/sidebar/ServicesSidebar';
// // import Canvas from './components/canvas/Canvas';
// // import SettingsModal from './components/modal/SettingsModal';
// // import HistoryModal from './components/modal/HistoryModal';
// // import PreviewPanel from './components/preview/PreviewPanel';

// // function App() {
// //     // Estados para el workflow
// //     const [workflowNodes, setWorkflowNodes] = useState([]);
// //     const [workflowConnections, setWorkflowConnections] = useState([]);
// //     const [workflowConfig, setWorkflowConfig] = useState({
// //         name: 'Nuevo Workflow',
// //         interval: '15m',
// //         status: 'ready', // ready, running, error
// //         lastSaved: null,
// //         notifications: {
// //             onSuccess: true,
// //             onError: true
// //         }
// //     });
// //     const [isSettingsOpen, setIsSettingsOpen] = useState(false);
// //     const [executionHistory, setExecutionHistory] = useState([]);
// //     const [isHistoryOpen, setIsHistoryOpen] = useState(false);

// //     const [isPreviewOpen, setIsPreviewOpen] = useState(false);
// // const [executionData, setExecutionData] = useState([]);
// // const [currentExecutingNode, setCurrentExecutingNode] = useState(null);
// //     // Cargar workflow guardado al iniciar
// //     useEffect(() => {
// //         const savedWorkflow = localStorage.getItem('current-workflow');
// //         if (savedWorkflow) {
// //             try {
// //                 const { nodes, connections, config } = JSON.parse(savedWorkflow);
// //                 setWorkflowNodes(nodes || []);
// //                 setWorkflowConnections(connections || []);
// //                 if (config) {
// //                     setWorkflowConfig(prev => ({
// //                         ...prev,
// //                         ...config,
// //                         status: 'ready'
// //                     }));
// //                 }
// //             } catch (error) {
// //                 console.error('Error al cargar el workflow:', error);
// //             }
// //         }
// //     }, []);

// //     // Función para mostrar notificaciones
// //     const showNotification = (message, type = 'success') => {
// //         const notification = document.createElement('div');
// //         notification.className = `fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg ${type === 'success' ? 'bg-green-500' : 'bg-red-500'
// //             } text-white`;
// //         notification.textContent = message;
// //         document.body.appendChild(notification);
// //         setTimeout(() => notification.remove(), 3000);
// //     };

// //     // Manejadores para la Toolbar
// //     const handleExecute = async () => {
// //         const errors = validateWorkflow();
        
// //         if (errors.length > 0) {
// //             showNotification(errors[0], 'error');
// //             return;
// //         }
    
// //         setWorkflowConfig(prev => ({ ...prev, status: 'running' }));
// //         setIsPreviewOpen(true);
        
// //         // Inicializar datos de ejecución
// //         const initialExecutionData = workflowNodes.map(node => ({
// //             ...node,
// //             status: 'pending',
// //             output: null,
// //             error: null,
// //             duration: null
// //         }));
// //         setExecutionData(initialExecutionData);
    
// //         // Simular ejecución de cada nodo
// //         for (const node of workflowNodes) {
// //             setCurrentExecutingNode(node);
            
// //             // Actualizar estado a 'running'
// //             setExecutionData(prev => prev.map(n => 
// //                 n.id === node.id ? { ...n, status: 'running' } : n
// //             ));
    
// //             // Simular procesamiento
// //             await new Promise(resolve => setTimeout(resolve, 1500));
    
// //             // Simular resultado (éxito o error)
// //             const success = Math.random() > 0.2;
// //             const duration = Math.floor(Math.random() * 1000) + 500;
    
// //             if (success) {
// //                 // Simular salida según tipo de nodo
// //                 let output;
// //                 switch (node.type) {
// //                     case 'api_rest':
// //                         output = { status: 200, data: { message: 'Success' } };
// //                         break;
// //                     case 'database':
// //                         output = { rows: [{ id: 1, name: 'Test' }] };
// //                         break;
// //                     case 'email':
// //                         output = { sent: true, recipient: 'test@example.com' };
// //                         break;
// //                     default:
// //                         output = { success: true };
// //                 }
    
// //                 setExecutionData(prev => prev.map(n => 
// //                     n.id === node.id ? { 
// //                         ...n, 
// //                         status: 'success',
// //                         output,
// //                         duration 
// //                     } : n
// //                 ));
// //             } else {
// //                 setExecutionData(prev => prev.map(n => 
// //                     n.id === node.id ? { 
// //                         ...n, 
// //                         status: 'error',
// //                         error: 'Error en la ejecución',
// //                         duration 
// //                     } : n
// //                 ));
// //                 break; // Detener ejecución en caso de error
// //             }
// //         }
    
// //         setCurrentExecutingNode(null);
// //         setWorkflowConfig(prev => ({ ...prev, status: 'ready' }));
    
// //         // Actualizar historial
// //         const newExecution = {
// //             id: executionHistory.length + 1,
// //             timestamp: new Date().toISOString(),
// //             status: executionData.every(node => node.status === 'success') ? 'success' : 'error',
// //             duration: executionData.reduce((sum, node) => sum + (node.duration || 0), 0),
// //             nodesExecuted: workflowNodes.length
// //         };
// //         setExecutionHistory(prev => [newExecution, ...prev]);
// //     };

// //     const validateWorkflow = () => {
// //         const errors = [];

// //         // Validar que haya nodos
// //         if (workflowNodes.length === 0) {
// //             errors.push('El workflow debe tener al menos un nodo');
// //         }

// //         // Validar conexiones
// //         if (workflowNodes.length > 1 && workflowConnections.length === 0) {
// //             errors.push('Los nodos deben estar conectados');
// //         }

// //         // Validar configuración de nodos
// //         workflowNodes.forEach(node => {
// //             if (!node.config || Object.keys(node.config).length === 0) {
// //                 errors.push(`El nodo "${node.name}" no está configurado`);
// //             }
// //         });

// //         return errors;
// //     };
// //     const handleSave = () => {
// //         try {
// //             const workflow = {
// //                 nodes: workflowNodes,
// //                 connections: workflowConnections,
// //                 config: {
// //                     ...workflowConfig,
// //                     lastSaved: new Date().toISOString()
// //                 }
// //             };
// //             localStorage.setItem('current-workflow', JSON.stringify(workflow));

// //             setWorkflowConfig(prev => ({
// //                 ...prev,
// //                 lastSaved: new Date().toISOString()
// //             }));

// //             showNotification('Workflow guardado correctamente');
// //         } catch (error) {
// //             console.error('Error al guardar:', error);
// //             showNotification('Error al guardar el workflow', 'error');
// //         }
// //     };

// //     // Manejadores para el SettingsModal
// //     const handleImport = (importedWorkflow) => {
// //         try {
// //             setWorkflowNodes(importedWorkflow.nodes || []);
// //             setWorkflowConnections(importedWorkflow.connections || []);
// //             if (importedWorkflow.config) {
// //                 setWorkflowConfig(prev => ({
// //                     ...prev,
// //                     ...importedWorkflow.config,
// //                     status: 'ready'
// //                 }));
// //             }
// //             handleSave();
// //             setIsSettingsOpen(false);
// //             showNotification('Workflow importado correctamente');
// //         } catch (error) {
// //             console.error('Error al importar:', error);
// //             showNotification('Error al importar el workflow', 'error');
// //         }
// //     };

// //     const handleClear = () => {
// //         setWorkflowNodes([]);
// //         setWorkflowConnections([]);
// //         setWorkflowConfig(prev => ({
// //             ...prev,
// //             name: 'Nuevo Workflow',
// //             lastSaved: null
// //         }));
// //         localStorage.removeItem('current-workflow');
// //         setIsSettingsOpen(false);
// //         showNotification('Workflow limpiado correctamente');
// //     };

// //     // Manejador para actualizaciones del Canvas
// //     const handleWorkflowUpdate = ({ nodes, connections }) => {
// //         setWorkflowNodes(nodes);
// //         setWorkflowConnections(connections);
// //     };

// //     return (
// //         <div className="h-screen flex flex-col">
// //             <Toolbar
// //                 name={workflowConfig.name}
// //                 status={workflowConfig.status}
// //                 interval={workflowConfig.interval}
// //                 onIntervalChange={(interval) =>
// //                     setWorkflowConfig(prev => ({ ...prev, interval }))
// //                 }
// //                 onExecute={handleExecute}
// //                 onSave={handleSave}
// //                 onSettingsClick={() => setIsSettingsOpen(true)}
// //                 onHistoryClick={() => setIsHistoryOpen(true)}
// //                 lastSaved={workflowConfig.lastSaved}
// //             />
// //             <div className="flex-1 flex overflow-hidden">
// //                 <ServicesSidebar />
// //                 <div className="flex-1 flex">
// //                     <Canvas
// //                         initialNodes={workflowNodes}
// //                         initialConnections={workflowConnections}
// //                         onSave={handleWorkflowUpdate}
// //                     />
// //                     {isPreviewOpen && (
// //                         <PreviewPanel
// //                             isOpen={isPreviewOpen}
// //                             onClose={() => setIsPreviewOpen(false)}
// //                             executionData={executionData}
// //                             currentNode={currentExecutingNode}
// //                         />
// //                     )}
// //                 </div>
// //             </div>
// //             <SettingsModal
// //                 isOpen={isSettingsOpen}
// //                 onClose={() => setIsSettingsOpen(false)}
// //                 config={workflowConfig}
// //                 onSave={(newConfig) => {
// //                     setWorkflowConfig(newConfig);
// //                     handleSave();
// //                 }}
// //                 onImport={handleImport}
// //                 onClear={handleClear}
// //             />
// //             <HistoryModal
// //                 isOpen={isHistoryOpen}
// //                 onClose={() => setIsHistoryOpen(false)}
// //                 history={executionHistory}
// //             />
// //         </div>
// //     );
// // }

// // export default App;

// import { useState, useEffect } from 'react';
// import Toolbar from './components/toolbar/Toolbar';
// import ServicesSidebar from './components/sidebar/ServicesSidebar';
// import Canvas from './components/canvas/Canvas';
// import SettingsModal from './components/modal/SettingsModal';
// import HistoryModal from './components/modal/HistoryModal';
// import PreviewPanel from './components/preview/PreviewPanel';
// import useNotificationBell from './components/toolbar/NotificationBell';

// function App() {
//     // Sistema de notificaciones
//     const { 
//         success, 
//         error, 
//         info, 
//         warning, 
//         NotificationBell 
//     } = useNotificationBell();

//     // Estados para el workflow
//     const [workflowNodes, setWorkflowNodes] = useState([]);
//     const [workflowConnections, setWorkflowConnections] = useState([]);
//     const [workflowConfig, setWorkflowConfig] = useState({
//         name: 'Nuevo Workflow',
//         interval: '15m',
//         status: 'ready', // ready, running, error
//         lastSaved: null,
//         notifications: {
//             onSuccess: true,
//             onError: true
//         }
//     });
//     const [isSettingsOpen, setIsSettingsOpen] = useState(false);
//     const [executionHistory, setExecutionHistory] = useState([]);
//     const [isHistoryOpen, setIsHistoryOpen] = useState(false);

//     const [isPreviewOpen, setIsPreviewOpen] = useState(false);
//     const [executionData, setExecutionData] = useState([]);
//     const [currentExecutingNode, setCurrentExecutingNode] = useState(null);
    
//     // Cargar workflow guardado al iniciar
//     useEffect(() => {
//         const savedWorkflow = localStorage.getItem('current-workflow');
//         if (savedWorkflow) {
//             try {
//                 const { nodes, connections, config } = JSON.parse(savedWorkflow);
//                 setWorkflowNodes(nodes || []);
//                 setWorkflowConnections(connections || []);
//                 if (config) {
//                     setWorkflowConfig(prev => ({
//                         ...prev,
//                         ...config,
//                         status: 'ready'
//                     }));
//                 }
//                 info('Workflow cargado correctamente');
//             } catch (error) {
//                 console.error('Error al cargar el workflow:', error);
//                 error('Error al cargar el workflow guardado');
//             }
//         }
//     }, []);

//     // Manejadores para la Toolbar
//     const handleExecute = async () => {
//         const errors = validateWorkflow();
        
//         if (errors.length > 0) {
//             warning(errors[0]);
//             return;
//         }
    
//         setWorkflowConfig(prev => ({ ...prev, status: 'running' }));
//         setIsPreviewOpen(true);
        
//         // Inicializar datos de ejecución
//         const initialExecutionData = workflowNodes.map(node => ({
//             ...node,
//             status: 'pending',
//             output: null,
//             error: null,
//             duration: null
//         }));
//         setExecutionData(initialExecutionData);
    
//         // Simular ejecución de cada nodo
//         for (const node of workflowNodes) {
//             setCurrentExecutingNode(node);
            
//             // Actualizar estado a 'running'
//             setExecutionData(prev => prev.map(n => 
//                 n.id === node.id ? { ...n, status: 'running' } : n
//             ));
    
//             // Simular procesamiento
//             await new Promise(resolve => setTimeout(resolve, 1500));
    
//             // Simular resultado (éxito o error)
//             const succeeds = Math.random() > 0.2;
//             const duration = Math.floor(Math.random() * 1000) + 500;
    
//             if (succeeds) {
//                 // Simular salida según tipo de nodo
//                 let output;
//                 switch (node.type) {
//                     case 'api_rest':
//                         output = { status: 200, data: { message: 'Success' } };
//                         break;
//                     case 'database':
//                         output = { rows: [{ id: 1, name: 'Test' }] };
//                         break;
//                     case 'email':
//                         output = { sent: true, recipient: 'test@example.com' };
//                         break;
//                     default:
//                         output = { success: true };
//                 }
    
//                 setExecutionData(prev => prev.map(n => 
//                     n.id === node.id ? { 
//                         ...n, 
//                         status: 'success',
//                         output,
//                         duration 
//                     } : n
//                 ));
                
//                 info(`Nodo "${node.name}" ejecutado correctamente`);
//             } else {
//                 setExecutionData(prev => prev.map(n => 
//                     n.id === node.id ? { 
//                         ...n, 
//                         status: 'error',
//                         error: 'Error en la ejecución',
//                         duration 
//                     } : n
//                 ));
                
//                 error(`Error en la ejecución del nodo "${node.name}"`);
//                 break; // Detener ejecución en caso de error
//             }
//         }
    
//         setCurrentExecutingNode(null);
//         setWorkflowConfig(prev => ({ ...prev, status: 'ready' }));
    
//         // Actualizar historial
//         const newExecution = {
//             id: executionHistory.length + 1,
//             timestamp: new Date().toISOString(),
//             status: executionData.every(node => node.status === 'success') ? 'success' : 'error',
//             duration: executionData.reduce((sum, node) => sum + (node.duration || 0), 0),
//             nodesExecuted: workflowNodes.length
//         };
//         setExecutionHistory(prev => [newExecution, ...prev]);
        
//         if (newExecution.status === 'success') {
//             success('Workflow ejecutado correctamente');
//         } else {
//             error('Error al ejecutar el workflow');
//         }
//     };

//     const validateWorkflow = () => {
//         const errors = [];

//         // Validar que haya nodos
//         if (workflowNodes.length === 0) {
//             errors.push('El workflow debe tener al menos un nodo');
//         }

//         // Validar conexiones
//         if (workflowNodes.length > 1 && workflowConnections.length === 0) {
//             errors.push('Los nodos deben estar conectados');
//         }

//         // Validar configuración de nodos
//         workflowNodes.forEach(node => {
//             if (!node.config || Object.keys(node.config).length === 0) {
//                 errors.push(`El nodo "${node.name}" no está configurado`);
//             }
//         });

//         return errors;
//     };
    
//     const handleSave = () => {
//         try {
//             const workflow = {
//                 nodes: workflowNodes,
//                 connections: workflowConnections,
//                 config: {
//                     ...workflowConfig,
//                     lastSaved: new Date().toISOString()
//                 }
//             };
//             localStorage.setItem('current-workflow', JSON.stringify(workflow));

//             setWorkflowConfig(prev => ({
//                 ...prev,
//                 lastSaved: new Date().toISOString()
//             }));

//             success('Workflow guardado correctamente');
//         } catch (error) {
//             console.error('Error al guardar:', error);
//             error('Error al guardar el workflow');
//         }
//     };

//     // Manejadores para el SettingsModal
//     const handleImport = (importedWorkflow) => {
//         try {
//             setWorkflowNodes(importedWorkflow.nodes || []);
//             setWorkflowConnections(importedWorkflow.connections || []);
//             if (importedWorkflow.config) {
//                 setWorkflowConfig(prev => ({
//                     ...prev,
//                     ...importedWorkflow.config,
//                     status: 'ready'
//                 }));
//             }
//             handleSave();
//             setIsSettingsOpen(false);
//             success('Workflow importado correctamente');
//         } catch (error) {
//             console.error('Error al importar:', error);
//             error('Error al importar el workflow');
//         }
//     };

//     const handleClear = () => {
//         setWorkflowNodes([]);
//         setWorkflowConnections([]);
//         setWorkflowConfig(prev => ({
//             ...prev,
//             name: 'Nuevo Workflow',
//             lastSaved: null
//         }));
//         localStorage.removeItem('current-workflow');
//         setIsSettingsOpen(false);
//         info('Workflow limpiado correctamente');
//     };

//     // Manejador para actualizaciones del Canvas
//     const handleWorkflowUpdate = ({ nodes, connections }) => {
//         setWorkflowNodes(nodes);
//         setWorkflowConnections(connections);
//     };

//     return (
//         <div className="h-screen flex flex-col">
//             <Toolbar
//                 name={workflowConfig.name}
//                 status={workflowConfig.status}
//                 interval={workflowConfig.interval}
//                 onIntervalChange={(interval) =>
//                     setWorkflowConfig(prev => ({ ...prev, interval }))
//                 }
//                 onExecute={handleExecute}
//                 onSave={handleSave}
//                 onSettingsClick={() => setIsSettingsOpen(true)}
//                 onHistoryClick={() => setIsHistoryOpen(true)}
//                 lastSaved={workflowConfig.lastSaved}
//                 notificationBell={<NotificationBell />}
//             />
//             <div className="flex-1 flex overflow-hidden">
//                 <ServicesSidebar />
//                 <div className="flex-1 flex">
//                     <Canvas
//                         initialNodes={workflowNodes}
//                         initialConnections={workflowConnections}
//                         onSave={handleWorkflowUpdate}
//                     />
//                     {isPreviewOpen && (
//                         <PreviewPanel
//                             isOpen={isPreviewOpen}
//                             onClose={() => setIsPreviewOpen(false)}
//                             executionData={executionData}
//                             currentNode={currentExecutingNode}
//                         />
//                     )}
//                 </div>
//             </div>
//             <SettingsModal
//                 isOpen={isSettingsOpen}
//                 onClose={() => setIsSettingsOpen(false)}
//                 config={workflowConfig}
//                 onSave={(newConfig) => {
//                     setWorkflowConfig(newConfig);
//                     handleSave();
//                 }}
//                 onImport={handleImport}
//                 onClear={handleClear}
//             />
//             <HistoryModal
//                 isOpen={isHistoryOpen}
//                 onClose={() => setIsHistoryOpen(false)}
//                 history={executionHistory}
//             />
//         </div>
//     );
// }

// export default App;

import { useState, useEffect } from 'react';
import Toolbar from './components/toolbar/Toolbar';
import ServicesSidebar from './components/sidebar/ServicesSidebar';
import Canvas from './components/canvas/Canvas';
import SettingsModal from './components/modal/SettingsModal';
import HistoryModal from './components/modal/HistoryModal';
import PreviewPanel from './components/preview/PreviewPanel';
// import { exportAsImage, exportAsJson } from './utils/exportUtils';
import { useTelegramNotifications } from './components/toolbar/Notification';
import ApiService from './services/api';
import { exportAsImage,exportAsJson } from './utils/workflowUtils';

function App() {
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
    const [executionData, setExecutionData] = useState([]);
    const [currentExecutingNode, setCurrentExecutingNode] = useState(null);
    const canvasRef = useState(null);
    
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

    // Manejadores para la Toolbar
    const handleExecute = async () => {
        const errors = validateWorkflow();
        
        if (errors.length > 0) {
            warning(errors[0]);
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
    
        // Ejecutar cada nodo
        for (const node of workflowNodes) {
            setCurrentExecutingNode(node);
            
            // Actualizar estado a 'running'
            setExecutionData(prev => prev.map(n => 
                n.id === node.id ? { ...n, status: 'running' } : n
            ));
    
            try {
                // Tiempo inicial
                const startTime = Date.now();
                
                // Ejecutar el nodo según su tipo
                let output;
                if (node.type === 'api_rest' && node.config?.url) {
                    // Ejecutar llamada a API real
                    info(`Ejecutando API: ${node.config.url}`);
                    
                    const method = node.config.method || 'GET';
                    const headers = node.config.headers || {};
                    const params = node.config.params || {};
                    const body = node.config.body || {};
                    
                    const response = await ApiService.request({
                        url: node.config.url,
                        method,
                        headers,
                        params: method === 'GET' ? body : params,
                        data: method !== 'GET' ? body : null,
                        timeout: 10000,
                        retry: 1
                    });
                    
                    if (response.error) {
                        throw new Error(response.message);
                    }
                    
                    output = response;
                } else {
                    // Simular procesamiento para otros tipos de nodos
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // Simular salida según tipo de nodo
                    switch (node.type) {
                        case 'database':
                            output = { rows: [{ id: 1, name: 'Test' }] };
                            break;
                        case 'email':
                            output = { sent: true, recipient: 'test@example.com' };
                            break;
                        default:
                            output = { success: true };
                    }
                }
                
                // Calcular duración
                const duration = Date.now() - startTime;
                
                // Actualizar nodo con éxito
                setExecutionData(prev => prev.map(n => 
                    n.id === node.id ? { 
                        ...n, 
                        status: 'success',
                        output,
                        duration 
                    } : n
                ));
                
                success(`Nodo "${node.name}" ejecutado correctamente`);
            } catch (err) {
                const duration = Date.now() - startTime;
                
                // Actualizar nodo con error
                setExecutionData(prev => prev.map(n => 
                    n.id === node.id ? { 
                        ...n, 
                        status: 'error',
                        error: err.message || 'Error en la ejecución',
                        duration 
                    } : n
                ));
                
                error(`Error al ejecutar el nodo "${node.name}": ${err.message}`);
                break; // Detener ejecución en caso de error
            }
        }
    
        setCurrentExecutingNode(null);
        setWorkflowConfig(prev => ({ ...prev, status: 'ready' }));
    
        // Actualizar historial
        const newExecution = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            status: executionData.every(node => node.status === 'success') ? 'success' : 'error',
            duration: executionData.reduce((sum, node) => sum + (node.duration || 0), 0),
            nodesExecuted: workflowNodes.length,
            nodes: executionData.map(n => ({
                id: n.id,
                name: n.name,
                status: n.status,
                duration: n.duration
            }))
        };
        
        setExecutionHistory(prev => [newExecution, ...prev]);
        
        if (newExecution.status === 'success') {
            success('Workflow ejecutado correctamente');
        } else {
            warning('Workflow finalizado con errores');
        }
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
            
            // Validaciones específicas por tipo
            if (node.type === 'api_rest' && !node.config?.url) {
                errors.push(`El nodo "${node.name}" debe tener una URL configurada`);
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

            success('Workflow guardado correctamente');
        } catch (error) {
            console.error('Error al guardar:', error);
            error('Error al guardar el workflow');
        }
    };
    
    // Exportar como imagen
    const handleExportImage = () => {
        if (!canvasRef.current) {
            warning('No se pudo acceder al canvas');
            return;
        }
        exportAsImage(
            canvasRef.current, 
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
                notificationBell={<NotificationBell />}
            />
            <div className="flex-1 flex overflow-hidden">
                <ServicesSidebar />
                <div className="flex-1 flex">
                    <Canvas
                        ref={canvasRef}
                        initialNodes={workflowNodes}
                        initialConnections={workflowConnections}
                        onSave={handleWorkflowUpdate}
                        onExportImage={handleExportImage}
                        onExportJson={handleExportJson}
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