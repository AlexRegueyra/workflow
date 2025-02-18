import { X, Clock, CheckCircle, XCircle } from 'lucide-react';

const HistoryModal = ({ isOpen, onClose, history }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-[800px] shadow-xl">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Historial de Ejecuciones</h2>
                    <button 
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 max-h-[600px] overflow-y-auto">
                    {history.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            No hay ejecuciones registradas
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((entry) => (
                                <div 
                                    key={entry.id} 
                                    className="border rounded-lg p-4 hover:bg-gray-50"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {entry.status === 'success' ? (
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-red-500" />
                                            )}
                                            <span className="font-medium">Ejecución #{entry.id}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Clock className="w-4 h-4" />
                                            {new Date(entry.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                    {entry.status === 'error' && (
                                        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                                            Error: {entry.error}
                                        </div>
                                    )}
                                    <div className="mt-2 text-sm text-gray-600">
                                        <div>Duración: {entry.duration}ms</div>
                                        <div>Nodos ejecutados: {entry.nodesExecuted}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;