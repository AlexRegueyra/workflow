import { X, PlayCircle, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const PreviewPanel = ({ isOpen, onClose, executionData, currentNode }) => {
    if (!isOpen) return null;

    return (
        <div className="w-80 bg-white border-l flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="font-medium">Vista Previa de Ejecución</h3>
                <button 
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded-full"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {executionData.map((node) => (
                    <div 
                        key={node.id}
                        className={`p-4 border-b ${currentNode?.id === node.id ? 'bg-purple-50' : ''}`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            {node.status === 'pending' && (
                                <PlayCircle className="w-5 h-5 text-gray-400" />
                            )}
                            {node.status === 'running' && (
                                <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                            )}
                            {node.status === 'success' && (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                            {node.status === 'error' && (
                                <AlertCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className="font-medium">{node.name}</span>
                        </div>

                        {node.status === 'success' && node.output && (
                            <div className="mt-2">
                                <div className="text-sm text-gray-500 mb-1">Salida:</div>
                                <pre className="text-sm bg-gray-50 p-2 rounded-md overflow-x-auto">
                                    {JSON.stringify(node.output, null, 2)}
                                </pre>
                            </div>
                        )}

                        {node.status === 'error' && node.error && (
                            <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                                {node.error}
                            </div>
                        )}

                        {node.status === 'running' && (
                            <div className="mt-2">
                                <div className="animate-pulse flex space-x-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="h-2 bg-gray-200 rounded"></div>
                                        <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {node.duration && (
                            <div className="mt-2 text-sm text-gray-500">
                                Duración: {node.duration}ms
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PreviewPanel;