import { X, Download, Upload, Trash2 } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, config, onSave, onImport, onClear }) => {
    if (!isOpen) return null;

    const handleExport = () => {
        const workflow = {
            config,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `workflow-${config.name.toLowerCase().replace(/\s+/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedWorkflow = JSON.parse(event.target?.result || '');
                    onImport?.(importedWorkflow);
                } catch (error) {
                    alert('Error al importar el workflow');
                    console.error('Error al importar:', error);
                }
            };
            reader.readAsText(file);
        }
    };

    const handleClear = () => {
        if (window.confirm('¿Estás seguro de que quieres limpiar el workflow? Esta acción no se puede deshacer.')) {
            onClear?.();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-[600px] shadow-xl">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Configuración del Workflow</h2>
                    <button 
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Nombre del Workflow */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Workflow
                        </label>
                        <input
                            type="text"
                            value={config.name}
                            onChange={(e) => onSave({ ...config, name: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Ejecución */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ejecución
                        </label>
                        <select
                            value={config.interval}
                            onChange={(e) => onSave({ ...config, interval: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="manual">Manual</option>
                            <option value="15m">Cada 15 minutos</option>
                            <option value="30m">Cada 30 minutos</option>
                            <option value="1h">Cada hora</option>
                            <option value="6h">Cada 6 horas</option>
                            <option value="12h">Cada 12 horas</option>
                            <option value="1d">Cada día</option>
                        </select>
                    </div>

                    {/* Acciones del Workflow */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-700">Acciones del Workflow</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={handleExport}
                                className="flex items-center justify-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
                            >
                                <Download className="w-4 h-4" />
                                Exportar Workflow
                            </button>
                            <label className="flex items-center justify-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 cursor-pointer">
                                <Upload className="w-4 h-4" />
                                Importar Workflow
                                <input
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    onChange={handleImport}
                                />
                            </label>
                            <button
                                onClick={handleClear}
                                className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-md hover:bg-red-50 col-span-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Limpiar Workflow
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                        Guardar cambios
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;