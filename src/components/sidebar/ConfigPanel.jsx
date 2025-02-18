import { X, Trash2, ArrowRight, CornerDownRight } from 'lucide-react';

const ConfigPanel = ({ node, connections = [], onUpdate, onClose, onDelete }) => {
    const handleInputChange = (field, value) => {
        const updatedNode = {
            ...node,
            config: {
                ...node.config,
                [field]: value
            }
        };
        onUpdate(updatedNode);
    };

    const handleNameChange = (newName) => {
        onUpdate({
            ...node,
            name: newName
        });
    };

    // Determinar si estamos editando una conexión
    const isConnection = node && connections && connections.some(c => c.id === node.id);

    return (
        <div className="w-80 bg-white border-l h-full overflow-y-auto shadow-lg">
            <div className="sticky top-0 bg-white z-10">
                <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-medium text-lg">
                        {isConnection ? 'Conexión' : 'Configuración'}
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Panel para conexiones */}
                {isConnection ? (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Etiqueta
                            </label>
                            <input
                                type="text"
                                value={node.label || ''}
                                onChange={(e) => onUpdate({...node, label: e.target.value})}
                                placeholder="Agregar etiqueta..."
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de Conexión
                            </label>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                <button
                                    onClick={() => onUpdate({...node, type: 'straight'})}
                                    className={`flex flex-col items-center p-2 rounded ${
                                        node.type === 'straight' ? 'bg-purple-100 ring-2 ring-purple-500' : 'bg-gray-50 hover:bg-gray-100'
                                    }`}
                                >
                                    <ArrowRight className="w-6 h-6 mb-1" />
                                    <span className="text-xs">Recta</span>
                                </button>
                                <button
                                    onClick={() => onUpdate({...node, type: 'curved'})}
                                    className={`flex flex-col items-center p-2 rounded ${
                                        (node.type === 'curved' || !node.type) ? 'bg-purple-100 ring-2 ring-purple-500' : 'bg-gray-50 hover:bg-gray-100'
                                    }`}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" className="mb-1">
                                        <path 
                                            d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12" 
                                            stroke="currentColor" 
                                            strokeWidth="2" 
                                            fill="none" 
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <span className="text-xs">Curva</span>
                                </button>
                                <button
                                    onClick={() => onUpdate({...node, type: 'angular'})}
                                    className={`flex flex-col items-center p-2 rounded ${
                                        node.type === 'angular' ? 'bg-purple-100 ring-2 ring-purple-500' : 'bg-gray-50 hover:bg-gray-100'
                                    }`}
                                >
                                    <CornerDownRight className="w-6 h-6 mb-1" />
                                    <span className="text-xs">Angular</span>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Panel para nodos */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre
                            </label>
                            <input
                                type="text"
                                value={node.name || ''}
                                onChange={(e) => handleNameChange(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        {node.service?.configFields?.map(field => (
                            <div key={field.name} className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    {field.label}
                                </label>
                                {field.type === 'select' ? (
                                    <select
                                        value={node.config?.[field.name] || ''}
                                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {field.options.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                ) : field.type === 'textarea' ? (
                                    <textarea
                                        value={node.config?.[field.name] || ''}
                                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
                                    />
                                ) : (
                                    <input
                                        type={field.type}
                                        value={node.config?.[field.name] || ''}
                                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                )}
                            </div>
                        ))}

                        {node.service?.id === 'api_rest' && (
                            <button 
                                className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                            >
                                Probar API
                            </button>
                        )}
                    </>
                )}

                {/* Botón de eliminar (común para nodos y conexiones) */}
                <div className="pt-4 mt-4 border-t">
                    <button 
                        onClick={onDelete}
                        className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar {isConnection ? 'conexión' : 'nodo'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfigPanel;