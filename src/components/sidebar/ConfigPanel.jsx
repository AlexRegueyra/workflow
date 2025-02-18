import { X } from 'lucide-react';

const ConfigPanel = ({ node, onUpdate, onClose }) => {
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

    return (
        <div className="w-80 bg-white border-l h-full overflow-y-auto shadow-lg">
            <div className="sticky top-0 bg-white z-10">
                <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-medium text-lg">Configuración</h3>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-4">
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

                {node.service.configFields?.map(field => (
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

                {node.service.id === 'api_rest' && (
                    <button 
                        className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                        Probar API
                    </button>
                )}
            </div>
        </div>
    );
};

export default ConfigPanel;