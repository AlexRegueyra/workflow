import { Globe, Database, Mail, Link, Bot, FileSpreadsheet, GitBranch, RotateCw } from 'lucide-react';

export const serviceTypes = [
    {
        id: 'api_rest',
        name: 'API REST',
        icon: Globe,
        color: 'bg-blue-500',
        canConnectTo: ['database', 'email', 'api_rest', 'webhook', 'conditional', 'transformer'],
        configFields: [
            { name: 'url', type: 'text', label: 'URL del endpoint' },
            { name: 'method', type: 'select', label: 'Método', options: ['GET', 'POST', 'PUT', 'DELETE'] },
            { name: 'headers', type: 'json', label: 'Headers' },
            { name: 'body', type: 'json', label: 'Body (para POST/PUT)' },
            {
                name: 'authentication', type: 'select', label: 'Autenticación',
                options: ['none', 'basic', 'bearer', 'apiKey']
            }
        ],
        outputType: 'json'
    },
    {
        id: 'database',
        name: 'Base de Datos',
        icon: Database,
        color: 'bg-green-500',
        canConnectTo: ['email', 'api_rest', 'webhook', 'conditional', 'transformer'],
        configFields: [
            { name: 'type', type: 'select', label: 'Tipo de BD', options: ['MySQL', 'PostgreSQL', 'MongoDB'] },
            { name: 'query', type: 'textarea', label: 'Query' },
            { name: 'connection', type: 'textarea', label: 'Cadena de conexión' }
        ],
        outputType: 'recordset'
    },
    {
        id: 'email',
        name: 'Email',
        icon: Mail,
        color: 'bg-yellow-500',
        canConnectTo: ['api_rest', 'webhook', 'conditional'],
        configFields: [
            { name: 'to', type: 'text', label: 'Para' },
            { name: 'subject', type: 'text', label: 'Asunto' },
            { name: 'body', type: 'textarea', label: 'Cuerpo del mensaje' },
            { name: 'isHtml', type: 'checkbox', label: '¿Formato HTML?' }
        ],
        outputType: 'notification'
    },
    {
        id: 'webhook',
        name: 'Webhook',
        icon: Link,
        color: 'bg-purple-500',
        canConnectTo: ['api_rest', 'database', 'email', 'conditional', 'transformer'],
        configFields: [
            { name: 'url', type: 'text', label: 'URL del webhook' },
            { name: 'method', type: 'select', label: 'Método', options: ['POST', 'PUT', 'PATCH'] },
            { name: 'headers', type: 'json', label: 'Headers' },
            { name: 'payload', type: 'json', label: 'Payload' }
        ],
        outputType: 'json'
    },
    {
        id: 'chatbot',
        name: 'Chatbot',
        icon: Bot,
        color: 'bg-pink-500',
        canConnectTo: ['api_rest', 'database', 'email', 'conditional'],
        configFields: [
            {
                name: 'platform', type: 'select', label: 'Plataforma',
                options: ['Telegram', 'WhatsApp', 'Facebook', 'Web']
            },
            { name: 'message', type: 'textarea', label: 'Mensaje' },
            {
                name: 'responseType', type: 'select', label: 'Tipo de respuesta',
                options: ['text', 'image', 'buttons']
            }
        ],
        outputType: 'message'
    },
    {
        id: 'spreadsheet',
        name: 'Hoja de Cálculo',
        icon: FileSpreadsheet,
        color: 'bg-green-400',
        canConnectTo: ['api_rest', 'database', 'email', 'conditional', 'transformer'],
        configFields: [
            {
                name: 'fileType', type: 'select', label: 'Tipo de archivo',
                options: ['Google Sheets', 'Excel', 'CSV']
            },
            { name: 'sheetName', type: 'text', label: 'Nombre de la hoja' },
            { name: 'range', type: 'text', label: 'Rango de celdas' },
            {
                name: 'operation', type: 'select', label: 'Operación',
                options: ['read', 'write', 'append']
            }
        ],
        outputType: 'data'
    },
    {
        id: 'conditional',
        name: 'Condicional',
        icon: GitBranch,
        color: 'bg-orange-500',
        canConnectTo: ['api_rest', 'database', 'email', 'webhook', 'chatbot', 'spreadsheet', 'transformer'],
        configFields: [
            { name: 'field', type: 'text', label: 'Campo a evaluar' },
            {
                name: 'operator', type: 'select', label: 'Operador',
                options: ['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan', 'exists']
            },
            { name: 'value', type: 'text', label: 'Valor a comparar' }
        ],
        outputType: 'conditional',
        outputHandles: [
            { id: 'true', label: 'Verdadero', color: 'green' },
            { id: 'false', label: 'Falso', color: 'red' }
        ]
    },
    {
        id: 'transformer',
        name: 'Transformador',
        icon: RotateCw,
        color: 'bg-blue-400',
        canConnectTo: ['api_rest', 'database', 'email', 'webhook', 'chatbot', 'spreadsheet', 'conditional'],
        configFields: [
            {
                name: 'transformType', type: 'select', label: 'Tipo de transformación',
                options: ['filter', 'map', 'reduce', 'aggregate', 'pick', 'flatten']
            },
            { name: 'transformConfig', type: 'json', label: 'Configuración de transformación' }
        ],
        outputType: 'transformed'
    }
];

export const validateConnection = (sourceNode, targetNode) => {
    // Validar que los nodos existan
    if (!sourceNode || !targetNode) {
        return { valid: false, message: 'Nodos inválidos' };
    }

    // Encontrar el tipo de servicio del nodo origen
    const sourceType = serviceTypes.find(t => t.id === sourceNode.type);
    if (!sourceType) {
        return { valid: false, message: 'Tipo de nodo origen no válido' };
    }

    // Validar la conexión según las reglas
    if (!sourceType.canConnectTo.includes(targetNode.type)) {
        // Buscar el nombre amigable del nodo destino
        const targetTypeName = serviceTypes.find(t => t.id === targetNode.type)?.name || targetNode.type;

        return {
            valid: false,
            message: `Un nodo ${sourceType.name} no puede conectarse a un nodo ${targetTypeName}`
        };
    }

    return { valid: true };
};

// Función auxiliar para crear nuevos nodos con configuración por defecto
export const createNodeWithDefaults = (type, position) => {
    const serviceType = serviceTypes.find(t => t.id === type);
    if (!serviceType) return null;

    // Crear configuración inicial con valores por defecto
    const config = {};
    serviceType.configFields.forEach(field => {
        // Asignar valores por defecto según el tipo
        switch (field.type) {
            case 'select':
                config[field.name] = field.options[0] || '';
                break;
            case 'checkbox':
                config[field.name] = false;
                break;
            case 'json':
                config[field.name] = {};
                break;
            default:
                config[field.name] = '';
                break;
        }
    });

    return {
        id: `${type}_${Date.now()}`,
        type,
        position,
        data: {
            label: serviceType.name,
            config
        }
    };
};