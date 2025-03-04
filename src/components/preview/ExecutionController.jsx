import React, { useState, useEffect, useCallback } from 'react';
import PreviewPanel from './PreviewPanel';

// Componente controlador que conecta el servicio de ejecución con el panel de visualización
const ExecutionController = ({
    executionManager, // Cambiado a executionManager para coincidir con tu implementación
    isOpen,
    onClose,
    initialExecutionData = [] // Opcional: datos iniciales si están disponibles
}) => {
    // Estados para manejar la información de ejecución
    const [executionData, setExecutionData] = useState(initialExecutionData);
    const [currentNodeId, setCurrentNodeId] = useState(null);
    const [workflowExecutionLog, setWorkflowExecutionLog] = useState([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionId, setExecutionId] = useState(null);
    const [nodeMap, setNodeMap] = useState(new Map()); // Movido aquí desde fuera del componente

    // Función para agregar logs al estado
    const addWorkflowLog = useCallback((logEntry) => {
        setWorkflowExecutionLog(prev => [...prev, logEntry]);
    }, []);

    // Crear una función para capturar los logs de la consola
    const setupConsoleCapture = useCallback(() => {
        // Guardar las referencias originales de console.log y console.error
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        // Sobrescribir console.log para capturar
        console.log = function (...args) {
            // Llamar a la función original primero
            originalLog.apply(console, args);

            // Procesar solo si está relacionado con la ejecución
            if (typeof args[0] === 'string') {
                const message = args[0];

                // Capturar resultados de nodos
                if (message.includes('Resultado de nodo')) {
                    try {
                        // Intentar extraer el ID del nodo y el tipo
                        const match = message.match(/Resultado de nodo ([^ ]+) \(([^)]+)\)/);
                        if (match) {
                            const nodeId = match[1];
                            const nodeType = match[2];

                            // Obtener el resultado (segundo argumento)
                            const result = args[1];

                            // Actualizar executionData con este resultado
                            setExecutionData(prev => {
                                // Verificar si el nodo ya existe en los datos
                                const existingNodeIndex = prev.findIndex(node => node.id === nodeId);

                                if (existingNodeIndex >= 0) {
                                    // Actualizar nodo existente
                                    const newData = [...prev];
                                    newData[existingNodeIndex] = {
                                        ...newData[existingNodeIndex],
                                        output: result,
                                        status: 'success', // Marcar como exitoso
                                        duration: Date.now() - (newData[existingNodeIndex].startTime || Date.now())
                                    };
                                    return newData;
                                } else {
                                    // Agregar nuevo nodo
                                    return [...prev, {
                                        id: nodeId,
                                        name: `${nodeType} ${nodeId.split(' ')[0]}`,
                                        type: nodeType,
                                        output: result,
                                        status: 'success',
                                        logs: [],
                                        startTime: Date.now(),
                                        duration: 0
                                    }];
                                }
                            });

                            // Agregar log
                            addWorkflowLog({
                                nodeId,
                                nodeType,
                                message: `Nodo ejecutado correctamente`,
                                timestamp: new Date().toISOString(),
                                result: JSON.stringify(result).substring(0, 100) + '...'
                            });
                        }
                    } catch (error) {
                        console.error('Error procesando log de resultado', error);
                    }
                }

                // Capturar inputs para nodos
                else if (message.includes('Inputs finales para nodo')) {
                    try {
                        const match = message.match(/Inputs finales para nodo ([^:]+):/);
                        if (match) {
                            const nodeId = match[1];

                            // Actualizar nodo como "running"
                            setExecutionData(prev => {
                                const existingNodeIndex = prev.findIndex(node => node.id === nodeId);

                                if (existingNodeIndex >= 0) {
                                    // Nodo ya existe, actualizar estado
                                    const newData = [...prev];
                                    newData[existingNodeIndex] = {
                                        ...newData[existingNodeIndex],
                                        status: 'running',
                                        startTime: Date.now()
                                    };
                                    return newData;
                                } else {
                                    // Determinar tipo de nodo por ID
                                    let nodeType = 'node';
                                    if (nodeId.includes('api_rest')) nodeType = 'API REST';
                                    if (nodeId.includes('conditional')) nodeType = 'Condicional';

                                    // Agregar nuevo nodo
                                    return [...prev, {
                                        id: nodeId,
                                        name: `${nodeType} ${nodeId.split(' ')[0]}`,
                                        type: nodeType,
                                        status: 'running',
                                        logs: [],
                                        startTime: Date.now()
                                    }];
                                }
                            });

                            // Establecer como nodo actual
                            setCurrentNodeId(nodeId);

                            // Agregar log
                            addWorkflowLog({
                                nodeId,
                                nodeType: 'workflow',
                                message: `Iniciando ejecución del nodo ${nodeId}`,
                                timestamp: new Date().toISOString()
                            });
                        }
                    } catch (error) {
                        console.error('Error procesando log de inputs', error);
                    }
                }

                // Capturar logs del nodo condicional
                else if (message.includes('🔍 Inputs COMPLETOS al nodo condicional') ||
                    message.includes('🧐 Detalles de evaluación')) {
                    try {
                        // Buscar el nodo condicional actualmente en ejecución
                        const conditionalNode = executionData.find(
                            node => node.type === 'Condicional' && node.status === 'running'
                        );

                        if (conditionalNode) {
                            // Agregar al log del nodo
                            setExecutionData(prev => {
                                const nodeIndex = prev.findIndex(node => node.id === conditionalNode.id);
                                if (nodeIndex >= 0) {
                                    const newData = [...prev];
                                    // Agregar log al nodo
                                    const logs = [...(newData[nodeIndex].logs || [])];
                                    logs.push({
                                        message: args[0],
                                        data: args[1] || null,
                                        timestamp: new Date().toISOString()
                                    });

                                    newData[nodeIndex] = {
                                        ...newData[nodeIndex],
                                        logs
                                    };
                                    return newData;
                                }
                                return prev;
                            });

                            // Si contiene detalles de evaluación, extraer información
                            if (message.includes('Detalles de evaluación')) {
                                const conditionalDetails = args[1];
                                if (conditionalDetails) {
                                    addWorkflowLog({
                                        nodeId: conditionalNode.id,
                                        nodeType: 'Condicional',
                                        message: `Evaluando condición: ${conditionalDetails.field} ${conditionalDetails.operator} ${conditionalDetails.expectedValue || ''}`,
                                        timestamp: new Date().toISOString(),
                                        details: `Valor actual: ${conditionalDetails.actualValue} (${conditionalDetails.actualType})`
                                    });
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error procesando log condicional', error);
                    }
                }
            }
        };

        // Sobrescribir console.error para capturar errores
        console.error = function (...args) {
            // Llamar a la función original primero
            originalError.apply(console, args);

            // Capturar errores relacionados con la ejecución
            if (typeof args[0] === 'string' && args[0].includes('Error en')) {
                try {
                    const errorMessage = args[0];
                    const errorDetail = args[1] || 'Error desconocido';

                    // Buscar un nodo en estado running para marcar como fallido
                    setExecutionData(prev => {
                        const runningNodeIndex = prev.findIndex(node => node.status === 'running');
                        if (runningNodeIndex >= 0) {
                            const newData = [...prev];
                            newData[runningNodeIndex] = {
                                ...newData[runningNodeIndex],
                                status: 'error',
                                error: errorDetail,
                                duration: Date.now() - (newData[runningNodeIndex].startTime || Date.now())
                            };
                            return newData;
                        }
                        return prev;
                    });

                    // Agregar al log general
                    addWorkflowLog({
                        nodeId: currentNodeId || 'unknown',
                        nodeType: 'error',
                        message: errorMessage,
                        error: errorDetail,
                        timestamp: new Date().toISOString()
                    });
                } catch (error) {
                    originalError.apply(console, ['Error procesando log de error', error]);
                }
            }
        };

        // Sobrescribir console.warn para capturar advertencias
        console.warn = function (...args) {
            // Llamar a la función original primero
            originalWarn.apply(console, args);

            // Capturar advertencias relacionadas con la ejecución
            if (typeof args[0] === 'string' && (
                args[0].includes('workflow') ||
                args[0].includes('nodo') ||
                args[0].includes('ejecución'))) {
                try {
                    addWorkflowLog({
                        nodeId: 'system',
                        nodeType: 'warning',
                        message: args[0],
                        timestamp: new Date().toISOString()
                    });
                } catch (error) {
                    originalError.apply(console, ['Error procesando advertencia', error]);
                }
            }
        };

        // Devolver función para restaurar los console originales
        return () => {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
        };
    }, [currentNodeId, executionData, addWorkflowLog]);

    // Iniciar captura de consola al montar el componente
    useEffect(() => {
        const restoreConsole = setupConsoleCapture();

        // Escuchar eventos de workflowManager si está disponible
        if (executionManager && executionManager.addEventListener) {
            // Escuchar eventos como workflow-started, node-completed, etc.
            // ...código para escuchar eventos...
        }

        // Limpiar al desmontar
        return () => {
            restoreConsole();
            // Limpiar event listeners de executionManager si existen
        };
    }, [setupConsoleCapture, executionManager]);

    // Efecto para limpiar datos cuando se cierra el panel
    useEffect(() => {
        if (!isOpen) {
            // Limpieza al cerrar el panel
            // Importante: No limpies todo inmediatamente para permitir animaciones de cierre
            const timer = setTimeout(() => {
                if (!isOpen) {
                    setExecutionData([]);
                    setWorkflowExecutionLog([]);
                    setCurrentNodeId(null);
                }
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Función para cancelar ejecución
    const handleCancelExecution = useCallback(() => {
        if (executionManager && executionManager.cancelExecution && executionId) {
            executionManager.cancelExecution(executionId);

            // Marcar todos los nodos running como cancelled
            setExecutionData(prev => prev.map(node => {
                if (node.status === 'running') {
                    return { ...node, status: 'cancelled' };
                }
                return node;
            }));

            // Agregar log
            addWorkflowLog({
                nodeId: 'system',
                nodeType: 'workflow',
                message: 'Ejecución cancelada por el usuario',
                timestamp: new Date().toISOString()
            });

            return true;
        }
        return false;
    }, [executionManager, executionId, addWorkflowLog]);

    return (
        <PreviewPanel
            isOpen={isOpen}
            onClose={onClose}
            executionData={executionData}
            currentNode={executionData.find(node => node.id === currentNodeId)}
            workflowExecutionLog={workflowExecutionLog}
            onCancelExecution={handleCancelExecution}
            isExecuting={isExecuting}
        />
    );
};

export default ExecutionController;