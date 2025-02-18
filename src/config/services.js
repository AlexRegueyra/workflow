import { Globe, Database, Mail } from 'lucide-react';
export const serviceTypes = [
    {
        id: 'api_rest',
        name: 'API REST',
        icon: Globe,
        color: 'bg-blue-500',
        canConnectTo: ['database'], // Solo puede conectarse a base de datos
        configFields: [
            { name: 'url', type: 'text', label: 'URL del endpoint' },
            { name: 'method', type: 'select', label: 'Método', options: ['GET', 'POST', 'PUT', 'DELETE'] }
        ],
        outputType: 'json'
    },
    {
        id: 'database',
        name: 'Base de Datos',
        icon: Database,
        color: 'bg-green-500',
        canConnectTo: ['email'], // Solo puede conectarse a email
        configFields: [
            { name: 'query', type: 'textarea', label: 'Query' }
        ],
        outputType: 'recordset'
    },
    {
        id: 'email',
        name: 'Email',
        icon: Mail,
        color: 'bg-yellow-500',
        canConnectTo: [], // No puede conectarse a nada
        configFields: [
            { name: 'to', type: 'text', label: 'Para' },
            { name: 'subject', type: 'text', label: 'Asunto' }
        ],
        outputType: 'notification'
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
        return {
            valid: false,
            message: `Un nodo ${sourceType.name} no puede conectarse a un nodo ${targetNode.type}`
        };
    }

    return { valid: true };
};