import { X, Trash2, ArrowRight, CornerDownRight } from 'lucide-react';
import NodeConfigPanel from './NodeConfigPanel';
import WebhookNodeConfig from './WebhookNodeConfig';
import ConditionalNodeConfig from './ConditionalNodeConfig';
import TransformerNodeConfig from './TransformerNodeConfig';
import DatabaseNodeConfig from './DatabaseNodeConfig';
import EmailNodeConfig from './EmailNodeConfig';
import ChatbotNodeConfig from './ChatbotNodeConfig';
import SpreadsheetNodeConfig from './SpreadsheetNodeConfig';
import { ExecutionManager } from '../../services/executionManager';



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

    // Renderizar panel de configuración específico según el tipo de nodo
    const renderSpecificConfig = () => {
        if (!node || !node.service) return null;
        
        // IMPORTANTE: Aseguramos de utilizar el identificador correcto para cada tipo
        // Mostramos exactamente qué ID estamos intentando identificar para debug
        // console.log("Tipo de nodo a renderizar:", node.service.id);
        
        const nodeType = node.service.id;
        
        switch (nodeType) {
            case 'api_rest':
                return (
                    <div className="mt-4 mb-2">
                        <h4 className="font-medium text-sm mb-3">Configuración de API REST</h4>
                        <NodeConfigPanel
                            node={node}
                            onUpdate={onUpdate}
                            onTestConnection={async () => {
                                try {
                                    // Adaptar el nodo para el ExecutionManager
                                    const testNode = {
                                        id: node.id,
                                        type: 'api_rest',
                                        data: {
                                            config: {
                                                url: node.config?.url,
                                                method: node.config?.method || 'GET',
                                                headers: node.config?.headers || {},
                                                body: node.config?.body || {},
                                                authentication: node.config?.authentication
                                            }
                                        }
                                    };
                                    
                                    // Crear una instancia de ExecutionManager
                                    const executionManager = new ExecutionManager();
                                    
                                    // Ejecutar el nodo
                                    return await executionManager.executeApiRestNode(testNode, {});
                                } catch (error) {
                                    console.error('Error al probar API:', error);
                                    throw error;
                                }
                            }}
                        />
                    </div>
                );
            case 'webhook':
                return (
                    <div className="mt-4 mb-2 border-t pt-3">
                        <h4 className="font-medium text-sm mb-3">Configuración de Webhook</h4>
                        <WebhookNodeConfig
                            node={node}
                            onChange={onUpdate}
                        />
                    </div>
                );
            case 'conditional':
                return (
                    <div className="mt-4 mb-2 border-t pt-3">
                        <h4 className="font-medium text-sm mb-3">Configuración de Condicional</h4>
                        <ConditionalNodeConfig
                            node={node}
                            onChange={onUpdate}
                        />
                    </div>
                );
            case 'transformer':
                return (
                    <div className="mt-4 mb-2 border-t pt-3">
                        <h4 className="font-medium text-sm mb-3">Configuración de Transformador</h4>
                        <TransformerNodeConfig
                            node={node}
                            onChange={onUpdate}
                        />
                    </div>
                );
            case 'dataBase':
            case 'database': // Añadimos ambas posibilidades para ser más flexibles
                return (
                    <div className="mt-4 mb-2 border-t pt-3">
                        <h4 className="font-medium text-sm mb-3">Configuración de Base de Datos</h4>
                        <DatabaseNodeConfig
                            node={node}
                            onChange={onUpdate}
                        />
                    </div>
                );
            case 'mail':
            case 'email': // Añadimos ambas posibilidades para ser más flexibles
                return (
                    <div className="mt-4 mb-2 border-t pt-3">
                        <h4 className="font-medium text-sm mb-3">Configuración de Email</h4>
                        <EmailNodeConfig
                            node={node}
                            onChange={onUpdate}
                        />
                    </div>
                );
            case 'chatbot':
            case 'chat': // Añadimos ambas posibilidades para ser más flexibles
                return (
                    <div className="mt-4 mb-2 border-t pt-3">
                        <h4 className="font-medium text-sm mb-3">Configuración de Chat bot</h4>
                        <ChatbotNodeConfig
                            node={node}
                            onChange={onUpdate}
                        />
                    </div>
                );
                case 'spreadsheet':
                    case 'hoja_calculo':
                        return (
                            <div className="mt-4 mb-2 border-t pt-3">
                                <h4 className="font-medium text-sm mb-3">Configuración de Hoja de Cálculo</h4>
                                <SpreadsheetNodeConfig
                                    node={{ 
                                        id: node.id,
                                        data: { config: node.config || {} }
                                    }}
                                    onChange={(updatedData) => {
                                        onUpdate({ ...node, config: updatedData.config });
                                    }}
                                />
                            </div>
                        );
            default:
                console.log("Tipo de nodo no reconocido:", nodeType);
                return null;
        }
    };

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
                                onChange={(e) => onUpdate({ ...node, label: e.target.value })}
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
                                    onClick={() => onUpdate({ ...node, type: 'straight' })}
                                    className={`flex flex-col items-center p-2 rounded ${node.type === 'straight' ? 'bg-purple-100 ring-2 ring-purple-500' : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
                                >
                                    <ArrowRight className="w-6 h-6 mb-1" />
                                    <span className="text-xs">Recta</span>
                                </button>
                                <button
                                    onClick={() => onUpdate({ ...node, type: 'curved' })}
                                    className={`flex flex-col items-center p-2 rounded ${(node.type === 'curved' || !node.type) ? 'bg-purple-100 ring-2 ring-purple-500' : 'bg-gray-50 hover:bg-gray-100'
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
                                    onClick={() => onUpdate({ ...node, type: 'angular' })}
                                    className={`flex flex-col items-center p-2 rounded ${node.type === 'angular' ? 'bg-purple-100 ring-2 ring-purple-500' : 'bg-gray-50 hover:bg-gray-100'
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

                        {/* Renderizar configuración específica según tipo de nodo */}
                        {renderSpecificConfig()}

                        {/* Si no hay configuración específica pero hay campos configurables, mostrarlos */}
                        {node.service?.configFields && !renderSpecificConfig() && (
                            <>
                                {node.service.configFields.map(field => (
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
                                        ) : field.type === 'json' ? (
                                            <textarea
                                                value={typeof node.config?.[field.name] === 'object' 
                                                    ? JSON.stringify(node.config?.[field.name], null, 2) 
                                                    : node.config?.[field.name] || '{}'}
                                                onChange={(e) => {
                                                    try {
                                                        const jsonValue = JSON.parse(e.target.value);
                                                        handleInputChange(field.name, jsonValue);
                                                    } catch (error) {
                                                        // Mantener el valor como string si no es JSON válido
                                                        handleInputChange(field.name, e.target.value);
                                                    }
                                                }}
                                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] font-mono text-sm"
                                                placeholder="{}"
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
                            </>
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