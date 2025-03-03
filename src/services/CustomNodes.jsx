import React from 'react';
import { Globe, Database, Mail, Link, Bot, FileSpreadsheet, GitBranch, RotateCw, Trash2 } from 'lucide-react';
import './CustomNodes.css'; // Crearemos este archivo después

// Componente base para todos los nodos
const BaseNode = ({ data, type, icon: Icon, color, onDelete }) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <div
            className={`custom-node ${type}-node`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Conector de entrada */}
            <div className="node-input-handle" />

            {/* Contenido del nodo */}
            <div className="node-content">
                {/* Número del nodo */}
                {data.number && (
                    <div className="node-number">{data.number}</div>
                )}

                {/* Botón de eliminar */}
                {isHovered && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(data);
                        }}
                        className="node-delete-btn"
                        title="Eliminar nodo"
                    >
                        <Trash2 size={14} />
                    </button>
                )}

                <div className="node-header">
                    <div className={`node-icon ${color}`}>
                        <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="node-title">{data.label || type}</div>
                </div>

                <div className="node-body">
                    {renderNodeConfig(data, type)}
                </div>
            </div>

            {/* Conectores de salida específicos por tipo */}
            {renderOutputHandles(type)}
        </div>
    );
};

// Función para renderizar información de configuración específica por tipo de nodo
const renderNodeConfig = (data, type) => {
    const config = data.config || {};

    switch (type) {
        case 'api_rest':
            return <p>{config.method || 'GET'} {config.url?.substring(0, 20) || ''}</p>;
        case 'database':
            return <p>{config.type || 'SQL'} Query</p>;
        case 'email':
            return <p>Para: {config.to?.substring(0, 20) || ''}</p>;
        case 'webhook':
            return <p>{config.method || 'POST'} {config.url?.substring(0, 20) || ''}</p>;
        case 'conditional':
            return <p>{config.field || ''} {config.operator || '='} {config.value || ''}</p>;
        case 'transformer':
            return <p>Transform: {config.transformType || 'map'}</p>;
        case 'chatbot':
            return <p>{config.platform || 'Chat'}: {config.message?.substring(0, 20) || ''}</p>;
        case 'spreadsheet':
            return <p>{config.operation || 'read'} {config.range || ''}</p>;
        default:
            return <p>{data.status || 'Ready'}</p>;
    }
};

// Función para renderizar los conectores de salida según el tipo de nodo
const renderOutputHandles = (type) => {
    if (type === 'conditional') {
        return (
            <>
                <div className="node-output-handle true-handle" data-handle-id="true" title="Verdadero" />
                <div className="node-output-handle false-handle" data-handle-id="false" title="Falso" />
            </>
        );
    }

    return <div className="node-output-handle" data-handle-id="output" />;
};

// Componentes específicos para cada tipo de nodo
export const ApiRestNode = (props) => (
    <BaseNode {...props} type="api_rest" icon={Globe} color="bg-blue-500" />
);

export const DatabaseNode = (props) => (
    <BaseNode {...props} type="database" icon={Database} color="bg-green-500" />
);

export const EmailNode = (props) => (
    <BaseNode {...props} type="email" icon={Mail} color="bg-yellow-500" />
);

export const WebhookNode = (props) => (
    <BaseNode {...props} type="webhook" icon={Link} color="bg-purple-500" />
);

export const ChatbotNode = (props) => (
    <BaseNode {...props} type="chatbot" icon={Bot} color="bg-pink-500" />
);

export const SpreadsheetNode = (props) => (
    <BaseNode {...props} type="spreadsheet" icon={FileSpreadsheet} color="bg-green-400" />
);

export const ConditionalNode = (props) => (
    <BaseNode {...props} type="conditional" icon={GitBranch} color="bg-orange-500" />
);

export const TransformerNode = (props) => (
    <BaseNode {...props} type="transformer" icon={RotateCw} color="bg-blue-400" />
);