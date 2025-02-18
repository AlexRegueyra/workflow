import { useState } from 'react';
import { Globe, Database, Mail, Trash2 } from 'lucide-react';
import { validateConnection } from '../../config/services';

const Node = ({ 
    node, 
    isSelected, 
    onClick, 
    onMouseDown, 
    onConnectorMouseDown,
    draggingConnection,
    onDelete,
    onContextMenu
}) => {
    const [isValidTarget, setIsValidTarget] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    
    // Mapa de iconos
    const iconMap = {
        api_rest: Globe,
        database: Database,
        email: Mail
    };

    const handleDragOver = (e) => {
        if (draggingConnection?.startNode) {
            const validation = validateConnection(draggingConnection.startNode, node);
            setIsValidTarget(validation.valid);
        }
    };

    const handleDelete = (e) => {
        e.stopPropagation(); // Evitar que se propague al onClick del nodo
        onDelete?.(node);
    };

    // Obtener el componente de icono correcto
    const IconComponent = iconMap[node.service.id];

    return (
        <div
            className={`absolute ${isSelected ? 'z-10' : 'z-0'}`}
            style={{ left: node.x, top: node.y }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Conector de entrada */}
            <div
                className={`absolute left-0 top-1/2 w-3 h-3 
                    ${isValidTarget ? 'bg-purple-500' : 'bg-gray-400'} 
                    rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 
                    hover:scale-125 transition-all duration-200`}
                onMouseDown={(e) => onConnectorMouseDown(e, node, 'input')}
            />

            {/* Nodo principal */}
            <div
                className={`bg-white rounded-lg shadow-lg w-64 
                    ${isSelected ? 'ring-2 ring-purple-500' : ''} 
                    ${isValidTarget ? 'ring-2 ring-purple-300' : ''}
                    cursor-grab active:cursor-grabbing
                    relative group`}
                onClick={(e) => onClick(e, node)}
                onMouseDown={(e) => onMouseDown(e, node)}
                onDragOver={handleDragOver}
                onContextMenu={(e) => onContextMenu?.(e, node)}
            >
                {/* Número del nodo */}
                {node.number && (
                    <div className="absolute -top-2 -left-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">
                        {node.number}
                    </div>
                )}

                {/* Botón de eliminar */}
                {isHovered && (
                    <button
                        onClick={handleDelete}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 opacity-0 group-hover:opacity-100"
                        title="Eliminar nodo"
                    >
                        <Trash2 size={14} />
                    </button>
                )}

                <div className="p-4 border-b">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${node.service.color}`}>
                            {IconComponent && <IconComponent className="w-4 h-4 text-white" />}
                        </div>
                        <span className="font-medium">{node.name}</span>
                    </div>
                </div>
                
                {/* Estado del nodo */}
                <div className="px-4 py-2 bg-gray-50 text-sm text-gray-500">
                    {node.status || 'Ready'}
                </div>
            </div>

            {/* Conector de salida */}
            <div
                className="absolute right-0 top-1/2 w-3 h-3 bg-purple-500 rounded-full 
                    cursor-pointer transform translate-x-1/2 -translate-y-1/2 
                    hover:scale-125 transition-transform"
                onMouseDown={(e) => onConnectorMouseDown(e, node, 'output')}
            />
        </div>
    );
};

export default Node;