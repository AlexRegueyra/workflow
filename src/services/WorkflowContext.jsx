// WorkflowContext.js
import React, { createContext, useContext, useState, useRef } from 'react';
// Importa executeWorkflow - descomenta esta línea cuando tengas el archivo listo
import { executeWorkflow } from './apiService';

const WorkflowContext = createContext();

export const useWorkflow = () => useContext(WorkflowContext);

export const WorkflowProvider = ({ children }) => {
    // Estado del workflow
    const [workflowState, setWorkflowState] = useState({
        isExecuting: false,
        progress: 0,
        activeNodeId: null,
        executionResults: null,
        executionLog: [],
        error: null
    });

    const abortControllerRef = useRef(null);

    /**
     * Ejecutar todo el workflow
     */
    const executeCurrentWorkflow = async (nodes, edges, initialData = {}) => {
        if (workflowState.isExecuting) {
            return {
                success: false, error: 'Ya hay una ejecución en curso'
            };
        }

        // Crear nuevo AbortController para este workflow
        abortControllerRef.current = typeof AbortController !== 'undefined' 
            ? new AbortController() 
            : { abort: () => console.log('Abort not supported') };

        try {
            setWorkflowState({
                isExecuting: true,
                progress: 0,
                activeNodeId: null,
                executionResults: null,
                executionLog: [],
                error: null
            });

            // Registrar listeners para eventos de progreso
            const unsubscribe = registerExecutionListeners((event) => {
                handleExecutionEvent(event);
            });

            // Ejecutar workflow
            // Comentado hasta que tengas executeWorkflow implementado
            const results = await executeWorkflow(
                nodes,
                edges,
                initialData,
                { signal: abortControllerRef.current.signal }
            );

            unsubscribe();

            setWorkflowState(prevState => ({
                ...prevState,
                isExecuting: false,
                progress: 100,
                activeNodeId: null,
                executionResults: results,
                executionLog: results.executionLog || prevState.executionLog,
                error: results.success ? null : results.error
            }));

            return results;
        } catch (error) {
            setWorkflowState(prevState => ({
                ...prevState,
                isExecuting: false,
                error: error.message
            }));

            return { success: false, error: error.message };
        }
    };

    /**
     * Ejecutar un nodo específico para pruebas
     */
    const executeNode = async (node, inputs = {}) => {
        try {
            setWorkflowState(prevState => ({
                ...prevState,
                isExecuting: true,
                activeNodeId: node.id,
                error: null
            }));

            // Ejecutar el nodo individualmente
            const result = await executeWorkflow(
                [node],
                [],
                inputs,
                { singleNodeMode: true }
            );

            setWorkflowState(prevState => ({
                ...prevState,
                isExecuting: false,
                activeNodeId: null,
                executionResults: {
                    [node.id]: result.results?.[node.id]
                },
                executionLog: result.executionLog || [],
                error: result.success ? null : result.error
            }));

            return result.success ? result.results?.[node.id] : null;
        } catch (error) {
            setWorkflowState(prevState => ({
                ...prevState,
                isExecuting: false,
                activeNodeId: null,
                error: error.message
            }));

            return null;
        }
    };

    /**
     * Cancelar la ejecución actual
     */
    const cancelExecution = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        setWorkflowState(prevState => ({
            ...prevState,
            isExecuting: false,
            activeNodeId: null,
            error: 'Ejecución cancelada por el usuario'
        }));
    };

    /**
     * Manejar eventos de progreso de ejecución
     */
    const handleExecutionEvent = (event) => {
        switch (event.type) {
            case 'node-start':
                setWorkflowState(prevState => ({
                    ...prevState,
                    activeNodeId: event.nodeId,
                    progress: calculateProgress(event, prevState),
                    executionLog: [...prevState.executionLog, {
                        nodeId: event.nodeId,
                        timestamp: new Date().toISOString(),
                        status: 'STARTED'
                    }]
                }));
                break;

            case 'node-complete':
                setWorkflowState(prevState => ({
                    ...prevState,
                    activeNodeId: null,
                    progress: calculateProgress(event, prevState),
                    executionLog: [...prevState.executionLog, {
                        nodeId: event.nodeId,
                        timestamp: new Date().toISOString(),
                        status: 'COMPLETED',
                        result: event.result
                    }]
                }));
                break;

            case 'node-error':
                setWorkflowState(prevState => ({
                    ...prevState,
                    activeNodeId: null,
                    progress: calculateProgress(event, prevState),
                    executionLog: [...prevState.executionLog, {
                        nodeId: event.nodeId,
                        timestamp: new Date().toISOString(),
                        status: 'ERROR',
                        error: event.error
                    }]
                }));
                break;

            case 'workflow-progress':
                setWorkflowState(prevState => ({
                    ...prevState,
                    progress: event.progress
                }));
                break;

            default:
                break;
        }
    };

    /**
     * Calcular progreso basado en nodos totales y completados
     */
    const calculateProgress = (event, prevState) => {
        if (event.totalNodes && event.completedNodes) {
            return Math.round((event.completedNodes / event.totalNodes) * 100);
        }
        return prevState.progress;
    };

    /**
     * Registrar listeners para eventos de ejecución
     * Esta función se conectaría con un sistema de eventos real
     */
    const registerExecutionListeners = (callback) => {
        // En una implementación real, esto podría usar WebSockets o EventSource
        const eventListenerId = Date.now().toString();

        // Simular eventos de progreso para fines de desarrollo
        window.workflowEvents = window.workflowEvents || {};
        window.workflowEvents[eventListenerId] = callback;

        // Función para desregistrar listener
        return () => {
            delete window.workflowEvents[eventListenerId];
        };
    };

    /**
     * Limpiar resultados de ejecución
     */
    const clearExecutionResults = () => {
        setWorkflowState(prevState => ({
            ...prevState,
            executionResults: null,
            executionLog: [],
            error: null
        }));
    };

    /**
     * Obtener los datos de resultado de un nodo específico
     */
    const getNodeResult = (nodeId) => {
        if (!workflowState.executionResults) return null;
        return workflowState.executionResults.results?.[nodeId] || null;
    };

    /**
     * Obtener los logs de ejecución filtrados por nodo
     */
    const getNodeExecutionLogs = (nodeId) => {
        return workflowState.executionLog.filter(log => log.nodeId === nodeId);
    };

    /**
     * Analizar el workflow para identificar posibles errores antes de ejecutar
     */
    const validateWorkflow = (nodes, edges) => {
        const issues = [];

        // Verificar nodos sin conexiones
        const connectedNodeIds = new Set([
            ...edges.map(e => e.source),
            ...edges.map(e => e.target)
        ]);

        const isolatedNodes = nodes.filter(node => !connectedNodeIds.has(node.id));
        if (isolatedNodes.length > 0) {
            issues.push({
                type: 'warning',
                message: `Hay ${isolatedNodes.length} nodos sin conexiones`,
                affectedNodes: isolatedNodes.map(n => n.id)
            });
        }

        // Verificar nodos de tipo API sin URL configurada
   // En la función validateWorkflow de WorkflowContext.js
const apisWithoutUrl = nodes
.filter(node => {
    // Intentar acceder a url de múltiples formas
    const url = node.data?.config?.url || node.config?.url || '';
    const nodeType = node.type || node.service?.id;
    return nodeType === 'api_rest' && !url.trim();
})
.map(n => n.id);
        if (apisWithoutUrl.length > 0) {
            issues.push({
                type: 'error',
                message: `Hay ${apisWithoutUrl.length} nodos API sin URL configurada`,
                affectedNodes: apisWithoutUrl
            });
        }

        // Verificar ciclos en el workflow
        try {
            sortNodesByDependencies(nodes, edges);
        } catch (error) {
            issues.push({
                type: 'error',
                message: 'El workflow contiene ciclos, lo que impide su ejecución',
                details: error.message
            });
        }

        return {
            valid: !issues.some(issue => issue.type === 'error'),
            issues
        };
    };

    /**
     * Función auxiliar para ordenar nodos (duplicada de apiService para validación)
     */
    const sortNodesByDependencies = (nodes, edges) => {
        const nodeMap = new Map(nodes.map(node => [node.id, { ...node, dependencies: [] }]));

        // Construir grafo de dependencias
        edges.forEach(edge => {
            const targetNode = nodeMap.get(edge.target);
            if (targetNode) {
                targetNode.dependencies.push(edge.source);
            }
        });

        // Algoritmo de ordenación topológica
        const visited = new Set();
        const tempVisited = new Set();
        const result = [];

        function visit(nodeId) {
            if (tempVisited.has(nodeId)) {
                throw new Error(`Ciclo detectado en el workflow. Nodo implicado: ${nodeId}`);
            }

            if (visited.has(nodeId)) return;

            tempVisited.add(nodeId);
            const node = nodeMap.get(nodeId);

            if (node) {
                node.dependencies.forEach(depId => visit(depId));
            }

            tempVisited.delete(nodeId);
            visited.add(nodeId);
            result.push(nodeMap.get(nodeId));
        }

        // Visitar todos los nodos
        nodes.forEach(node => {
            if (!visited.has(node.id)) {
                visit(node.id);
            }
        });

        return result.reverse();
    };

    // Proveer el contexto con todos los métodos y estado
    const contextValue = {
        // Estado
        workflowState,
        isExecuting: workflowState.isExecuting,
        progress: workflowState.progress,
        activeNodeId: workflowState.activeNodeId,
        executionResults: workflowState.executionResults,
        executionLog: workflowState.executionLog,
        error: workflowState.error,

        // Métodos
        executeWorkflow: executeCurrentWorkflow,
        executeNode,
        cancelExecution,
        clearExecutionResults,
        getNodeResult,
        getNodeExecutionLogs,
        validateWorkflow
    };

    return (
        <WorkflowContext.Provider value={contextValue}>
            {children}
        </WorkflowContext.Provider>
    );
};