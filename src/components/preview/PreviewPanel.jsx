import React, { useState, useEffect } from 'react';
import {
    X,
    PlayCircle,
    AlertCircle,
    CheckCircle,
    Loader,
    FileText,
    XCircle,
    Clock,
    ArrowRight,
    List,
    Eye
} from 'lucide-react';
import DatabaseResultsViewer from '../../utils/resultsBd';

const PreviewPanel = ({
    isOpen,
    onClose,
    executionData,
    currentNode,
    workflowExecutionLog,
    onCancelExecution,
    isExecuting
}) => {
    const [selectedNodeLogs, setSelectedNodeLogs] = useState(null);
    const [showFullExecutionLog, setShowFullExecutionLog] = useState(false);
    const [showLogButton, setShowLogButton] = useState(true);

    // Cuando cambia executionData, verificar si hay logs
    useEffect(() => {
        const hasLogs = executionData && executionData.some(node => node.logs && node.logs.length > 0);
        setShowLogButton(hasLogs || (workflowExecutionLog && workflowExecutionLog.length > 0));
    }, [executionData, workflowExecutionLog]);

    if (!isOpen) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'bg-green-50 border-green-200';
            case 'error': return 'bg-red-50 border-red-200';
            case 'running': return 'bg-blue-50 border-blue-200';
            case 'pending': return 'bg-gray-50 border-gray-200';
            case 'cancelled': return 'bg-yellow-50 border-yellow-200';
            default: return 'bg-gray-50 border-gray-200';
        }
    };

    const getStatusTextColor = (status) => {
        switch (status) {
            case 'success': return 'text-green-700';
            case 'error': return 'text-red-700';
            case 'running': return 'text-blue-700';
            case 'pending': return 'text-gray-700';
            case 'cancelled': return 'text-yellow-700';
            default: return 'text-gray-700';
        }
    };

    const renderStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <PlayCircle className="w-5 h-5 text-gray-400" />;
            case 'running':
                return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'cancelled':
                return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            default:
                return null;
        }
    };

    const capitalizeFirstLetter = (string) => {
        return string?.charAt(0).toUpperCase() + string?.slice(1);
    };

    // Componente para mostrar los logs de un nodo específico
    const NodeLogModal = ({ node }) => {
        if (!node) return null;

        const getLogItemClass = (logItem) => {
            if (logItem.error) return 'text-red-600';
            if (logItem.message?.toLowerCase().includes('error')) return 'text-red-600';
            if (logItem.message?.toLowerCase().includes('warn')) return 'text-yellow-600';
            if (logItem.message?.toLowerCase().includes('info')) return 'text-blue-600';
            return 'text-gray-700';
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                <div className="bg-white rounded-lg w-3/4 max-h-[80vh] overflow-auto p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold flex items-center">
                            {renderStatusIcon(node.status)}
                            <span className="ml-2">Logs de {node.name}</span>
                            <span className={`ml-2 text-sm px-2 py-1 rounded-md ${getStatusTextColor(node.status)} bg-opacity-20 ${getStatusColor(node.status)}`}>
                                {capitalizeFirstLetter(node.status)}
                            </span>
                        </h2>
                        <button
                            onClick={() => setSelectedNodeLogs(null)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {node.logs && node.logs.length > 0 ? (
                        <div className="bg-gray-100 p-4 rounded-md mb-4">
                            <h3 className="text-sm font-medium mb-2 flex items-center">
                                <FileText className="w-4 h-4 mr-1" /> Logs de ejecución
                            </h3>
                            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md bg-white">
                                {node.logs.map((log, index) => (
                                    <div
                                        key={index}
                                        className={`p-2 border-b border-gray-100 text-sm ${getLogItemClass(log)}`}
                                    >
                                        <div className="flex items-start">
                                            <span className="text-gray-500 text-xs mr-2 font-mono">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                            <span className="flex-1">{log.message}</span>
                                        </div>
                                        {log.error && (
                                            <div className="mt-1 text-red-600 text-xs bg-red-50 p-1 rounded">
                                                {log.error}
                                            </div>
                                        )}
                                        {log.data && (
                                            <div className="mt-1 text-xs bg-gray-50 p-1 rounded font-mono overflow-x-auto">
                                                {typeof log.data === 'object'
                                                    ? JSON.stringify(log.data, null, 2)
                                                    : String(log.data)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-100 p-4 rounded-md mb-4 text-center text-gray-500">
                            No hay logs disponibles para este nodo
                        </div>
                    )}
                

                    {node.output && (
                        <div className="mt-4">
                            <h3 className="text-sm font-medium mb-2 flex items-center">
                                <ArrowRight className="w-4 h-4 mr-1" /> Salida del nodo
                            </h3>
                            {node.type === 'database' ? (
                                <DatabaseResultsViewer result={node.output} />
                            ) : (
                                <pre className="text-sm bg-gray-100 p-3 rounded-md overflow-x-auto border">
                                    {JSON.stringify(node.output, null, 2)}
                                </pre>
                            )}
                        </div>
                    )}
                    {node.error && (
                        <div className="mt-4">
                            <h3 className="text-sm font-medium mb-2 flex items-center text-red-600">
                                <AlertCircle className="w-4 h-4 mr-1" /> Error
                            </h3>
                            <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                                {node.error}
                            </div>
                        </div>
                    )}

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => setSelectedNodeLogs(null)}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Componente para mostrar el log completo de ejecución del workflow
    const ExecutionLogModal = () => {
        if (!workflowExecutionLog || workflowExecutionLog.length === 0) {
            return (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg w-3/4 max-h-[80vh] overflow-auto p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Log de Ejecución del Workflow</h2>
                            <button
                                onClick={() => setShowFullExecutionLog(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="bg-gray-100 p-4 rounded-md text-center text-gray-500">
                            No hay información de ejecución disponible
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                <div className="bg-white rounded-lg w-3/4 max-h-[80vh] overflow-auto p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Log de Ejecución del Workflow</h2>
                        <button
                            onClick={() => setShowFullExecutionLog(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="bg-gray-100 p-4 rounded-md">
                        <div className="space-y-1">
                            {workflowExecutionLog.map((log, index) => (
                                <div
                                    key={index}
                                    className={`p-2 border-b border-gray-200 bg-white rounded-md ${log.error ? 'bg-red-50' :
                                        log.nodeType === 'warning' ? 'bg-yellow-50' : 'bg-white'
                                        }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="text-gray-500 text-xs whitespace-nowrap font-mono">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium">{log.nodeType || 'Workflow'}</span>
                                                <span className="text-xs text-gray-500">[{log.nodeId || 'sistema'}]</span>
                                            </div>
                                            <div className="text-sm mt-1">{log.message}</div>
                                            {log.error && (
                                                <div className="mt-1 text-red-600 text-xs bg-red-50 p-1 rounded">
                                                    {log.error}
                                                </div>
                                            )}
                                            {log.details && (
                                                <div className="mt-1 text-xs bg-gray-100 p-1 rounded">
                                                    {log.details}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Reemplaza la función de filtrado actual con esta
    const filteredExecutionData = executionData.filter(node =>
        node.status === 'success' || node.status === 'error' || node.status === 'running'
    );
    return (
        <div className="w-80 bg-white border-l flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="font-medium">Vista Previa de Ejecución</h3>
                <div className="flex items-center gap-2">
                    {showLogButton && (
                        <button
                            onClick={() => setShowFullExecutionLog(true)}
                            className="p-1 hover:bg-gray-100 rounded-full"
                            title="Ver log completo de ejecución"
                        >
                            <List className="w-5 h-5 text-gray-500" />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Content - Área principal para nodos */}
            <div className="flex-1 overflow-y-auto">
                {filteredExecutionData.map((node) => (
                    <div
                        key={node.id}
                        className={`p-4 border-b ${getStatusColor(node.status)} ${currentNode?.id === node.id ? 'ring-2 ring-purple-500' : ''}`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            {renderStatusIcon(node.status)}
                            <div className="flex-1">
                                <span className="font-medium">{node.name}</span>
                                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getStatusTextColor(node.status)} bg-opacity-20 ${getStatusColor(node.status)}`}>
                                    {capitalizeFirstLetter(node.status)}
                                </span>
                            </div>

                            {(node.logs?.length > 0 || node.output || node.error) && (
                                <button
                                    onClick={() => setSelectedNodeLogs(node)}
                                    className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded"
                                    title="Ver logs del nodo"
                                >
                                    <FileText className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {node.status === 'success' && node.output && (
                            <div className="mt-2">
                                <div className="text-xs text-gray-500 mb-1 flex items-center">
                                    <ArrowRight className="w-4 h-4 mr-1" /> Salida:
                                </div>
                                <div className="bg-white p-2 rounded-md overflow-hidden border">
                                    {node.type === 'database' ? (
                                        <>
                                            <div className="text-xs flex items-center gap-1 mb-1">
                                                <span className="font-medium">Resultado de consulta</span>
                                                {node.output.data?.rowsAffected && (
                                                    <span className="text-gray-500">{node.output.data.rowsAffected} filas</span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setSelectedNodeLogs(node)}
                                                className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                                            >
                                                Ver resultados completos
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-xs text-gray-700 truncate">
                                                {typeof node.output === 'object'
                                                    ? JSON.stringify(node.output).substring(0, 120) + '...'
                                                    : String(node.output).substring(0, 120) + '...'}
                                            </div>
                                            <button
                                                onClick={() => setSelectedNodeLogs(node)}
                                                className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                                            >
                                                Ver detalle completo
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {node.status === 'error' && node.error && (
                            <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200 flex items-start">
                                <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-medium text-xs">Error:</div>
                                    <div className="text-xs">{node.error}</div>
                                </div>
                            </div>
                        )}

                        <div className="mt-2 flex gap-2 text-xs">
                            {node.duration !== undefined && (
                                <div className="text-gray-500 flex items-center">
                                    <Clock className="w-3 h-3 mr-1" /> {node.duration}ms
                                </div>
                            )}

                            {node.logs && node.logs.length > 0 && (
                                <div className="text-gray-500">
                                    {node.logs.length} eventos
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {executionData.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No hay datos de ejecución disponibles
                    </div>
                )}

                {/* Botón para ver logs completos del workflow - MOVIDO AQUÍ */}
                {showLogButton && (
                    <div className="px-4 py-3 border-t">
                        <button
                            onClick={() => setShowFullExecutionLog(true)}
                            className="w-full py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-sm font-medium flex items-center justify-center"
                        >
                            <List className="w-4 h-4 mr-2" />
                            Ver logs de ejecución completos
                        </button>
                    </div>
                )}

                {/* Botón para debugging - MOVIDO AQUÍ */}
                {(!showLogButton && (isExecuting || executionData.length > 0)) && (
                    <div className="px-4 py-3 border-t">
                        <button
                            onClick={() => setShowFullExecutionLog(true)}
                            className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium flex items-center justify-center"
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            Verificar disponibilidad de logs
                        </button>
                    </div>
                )}
            </div>

            {selectedNodeLogs && <NodeLogModal node={selectedNodeLogs} />}
            {showFullExecutionLog && <ExecutionLogModal />}
        </div>
    );
};

export default PreviewPanel;