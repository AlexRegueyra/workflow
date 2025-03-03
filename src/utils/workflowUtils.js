// src/utils/exportUtils.js
import html2canvas from 'html2canvas';

/**
 * Exporta el canvas como imagen PNG
 * @param {HTMLElement|null} container - Elemento contenedor del workflow (puede ser null)
 * @param {string} filename - Nombre del archivo
 * @param {Function} onSuccess - Callback en caso de éxito
 * @param {Function} onError - Callback en caso de error
 */
export const exportAsImage = async (container, filename = 'workflow.png', onSuccess, onError) => {
    try {
        // Si no se proporciona un contenedor, buscar automáticamente el canvas en el DOM
        if (!container) {
            container = document.querySelector('[data-workflow-canvas]');
            
            // Si aún no lo encontramos, intentar con el elemento principal del canvas
            if (!container) {
                container = document.querySelector('.canvas-container') || 
                            document.querySelector('[class*="canvas"]') ||
                            document.querySelector('[class*="workflow"]');
            }
            
            // Si todavía no lo encontramos, usar todo el área principal
            if (!container) {
                container = document.querySelector('main') || document.body;
            }
        }

        if (!container) {
            throw new Error('No se pudo identificar el contenedor del workflow');
        }

        // Crear una copia del contenedor para capturar solo el canvas
        const workflowContainer = container.querySelector('[data-workflow-canvas]') || container;

        // Opciones para mejorar la calidad de la imagen
        const options = {
            scale: 2, // Mayor resolución
            backgroundColor: '#f9fafb',
            logging: false,
            allowTaint: true,
            useCORS: true,
            // Ignorar elementos que no queremos en la captura
            ignoreElements: (element) => {
                return element.classList.contains('toolbar') ||
                    element.classList.contains('sidebar') ||
                    element.classList.contains('modal') ||
                    element.classList.contains('notification') ||
                    element.tagName === 'BUTTON';
            }
        };

        // Crear canvas
        const canvas = await html2canvas(workflowContainer, options);

        // Convertir a URL de datos
        const imgData = canvas.toDataURL('image/png');

        // Crear link de descarga
        const link = document.createElement('a');
        link.download = filename;
        link.href = imgData;

        // Simular clic y descargar
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Éxito
        if (typeof onSuccess === 'function') {
            onSuccess('Workflow exportado como imagen');
        }

        return imgData;
    } catch (error) {
        console.error('Error al exportar como imagen:', error);

        // Error
        if (typeof onError === 'function') {
            onError(`Error al exportar como imagen: ${error.message}`);
        }

        throw error;
    }
};
/**
 * Exporta el workflow como JSON, manejando las referencias circulares de manera inteligente
 * @param {Object} workflow - Objeto con nodos y conexiones
 * @param {string} filename - Nombre del archivo
 * @param {Function} onSuccess - Callback en caso de éxito
 * @param {Function} onError - Callback en caso de error
 */
export const exportAsJson = (container, filename = 'workflow.json', onSuccess, onError) => {
    try {
        // Verificar si se pasó un elemento DOM o un objeto de datos
        let workflowData;
        
        if (container instanceof HTMLElement) {
            // Si es un elemento DOM, extraer los datos del workflow desde las props asociadas
            // En lugar de intentar serializar el DOM directamente
            workflowData = {
                nodes: window.workflowNodes || [],
                connections: window.workflowConnections || [],
                config: window.workflowConfig || {}
            };
        } else {
            // Es un objeto de datos directamente, lo usamos tal cual
            workflowData = container;
        }

        // Procesar específicamente para un workflow, manteniendo su estructura
        const cleanWorkflow = {
            nodes: workflowData.nodes?.map(node => cleanNode(node)) || [],
            connections: workflowData.connections?.map(conn => cleanConnection(conn)) || [],
            config: workflowData.config ? { ...workflowData.config } : {}
        };
        
        const jsonStr = JSON.stringify(cleanWorkflow, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = filename;
        link.href = url;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Liberar URL
        setTimeout(() => URL.revokeObjectURL(url), 100);

        if (typeof onSuccess === 'function') {
            onSuccess('Workflow exportado como JSON');
        }

        return true;
    } catch (error) {
        console.error('Error al exportar como JSON:', error);

        if (typeof onError === 'function') {
            onError(`Error al exportar como JSON: ${error.message}`);
        }

        throw error;
    }
};

/**
 * Limpia un nodo para exportación, preservando sus propiedades importantes
 * @param {Object} node - Nodo a limpiar
 * @returns {Object} - Nodo limpio
 */
function cleanNode(node) {
    if (!node) return null;
    
    // Extraer solo las propiedades relevantes que no causan problemas de serialización
    return {
        id: node.id,
        type: node.type,
        name: node.name,
        x: node.x,
        y: node.y,
        service: node.service ? {
            id: node.service.id,
            name: node.service.name,
            category: node.service.category,
            description: node.service.description,
            icon: node.service.icon,
            // Otras propiedades relevantes del servicio
        } : null,
        config: { ...node.config },  // Copia segura de la configuración
        number: node.number
        // Añadir otras propiedades importantes según sea necesario
    };
}

/**
 * Limpia una conexión para exportación, preservando sus propiedades importantes
 * @param {Object} connection - Conexión a limpiar
 * @returns {Object} - Conexión limpia
 */
function cleanConnection(connection) {
    if (!connection) return null;
    
    return {
        id: connection.id,
        // Usando cleanNode para manejar los nodos de inicio y fin
        startNode: cleanNode(connection.startNode),
        endNode: cleanNode(connection.endNode),
        label: connection.label || '',
        type: connection.type || 'curved'
        // Añadir otras propiedades importantes según sea necesario
    };
}


/**
 * Genera una URL compartible con el workflow codificado
 * @param {Object} workflow - Objeto con nodos y conexiones
 * @param {Function} onSuccess - Callback en caso de éxito
 * @param {Function} onError - Callback en caso de error
 * @returns {string|null} - La URL generada o null en caso de error
 */
export const generateShareableUrl = (workflow, onSuccess, onError) => {
    try {
        // Verificar si se pasó un elemento DOM o un objeto de datos
        let workflowData;
        
        if (workflow instanceof HTMLElement) {
            workflowData = {
                nodes: window.workflowNodes || [],
                connections: window.workflowConnections || [],
                config: window.workflowConfig || {}
            };
        } else {
            workflowData = workflow;
        }

        // Limpiar el workflow usando nuestras funciones específicas
        const cleanWorkflow = {
            nodes: workflowData.nodes?.map(node => cleanNode(node)) || [],
            connections: workflowData.connections?.map(conn => cleanConnection(conn)) || []
        };
        
        const jsonStr = JSON.stringify(cleanWorkflow);
        const encoded = btoa(encodeURIComponent(jsonStr));
        const url = new URL(window.location.href);
        url.searchParams.set('workflow', encoded);
        const shareableUrl = url.toString();

        // Copiar al portapapeles
        navigator.clipboard.writeText(shareableUrl)
            .then(() => {
                if (typeof onSuccess === 'function') {
                    onSuccess('URL copiada al portapapeles');
                }
            })
            .catch(err => {
                console.error('Error al copiar URL:', err);
                // Aún devolvemos la URL aunque falló la copia
                if (typeof onSuccess === 'function') {
                    onSuccess('URL generada (copia manual requerida)');
                }
            });

        return shareableUrl;
    } catch (error) {
        console.error('Error al generar URL compartible:', error);
        if (typeof onError === 'function') {
            onError(`Error al generar URL: ${error.message}`);
        }
        return null;
    }
};

/**
 * Carga un workflow desde una URL compartible
 * @returns {Object|null} - Objeto con nodos y conexiones o null si no hay workflow
 */
export const loadFromShareableUrl = () => {
    try {
        const url = new URL(window.location.href);
        const encoded = url.searchParams.get('workflow');
        if (!encoded) return null;

        const jsonStr = decodeURIComponent(atob(encoded));
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('Error al cargar workflow desde URL:', error);
        return null;
    }
};

/**
 * Alinea nodos según una dirección específica
 * @param {Array} nodes - Array de nodos
 * @param {Object} targetNode - Nodo de referencia para alinear
 * @param {String} direction - Dirección de alineación ('left', 'right', 'top', 'bottom', 'horizontalCenter', 'verticalCenter')
 * @returns {Array} - Nodos alineados
 */
export const alignNodes = (nodes, targetNode, direction) => {
    if (!targetNode || !nodes.length) return nodes;

    const updatedNodes = [...nodes];

    updatedNodes.forEach(node => {
        if (node.id === targetNode.id) return;

        switch (direction) {
            case 'left':
                node.x = targetNode.x;
                break;
            case 'right':
                node.x = targetNode.x + (targetNode.width || 256) - (node.width || 256);
                break;
            case 'top':
                node.y = targetNode.y;
                break;
            case 'bottom':
                node.y = targetNode.y + (targetNode.height || 64) - (node.height || 64);
                break;
            case 'horizontalCenter':
                node.x = targetNode.x + ((targetNode.width || 256) / 2) - ((node.width || 256) / 2);
                break;
            case 'verticalCenter':
                node.y = targetNode.y + ((targetNode.height || 64) / 2) - ((node.height || 64) / 2);
                break;
            default:
                break;
        }
    });

    return updatedNodes;
};

/**
 * Distribuye nodos equitativamente en un eje
 * @param {Array} nodes - Array de nodos
 * @param {String} axis - Eje de distribución ('horizontal' o 'vertical')
 * @returns {Array} - Nodos distribuidos
 */
export const distributeNodes = (nodes, axis) => {
    if (!nodes.length || nodes.length < 3) return nodes;

    const updatedNodes = [...nodes];
    const sortedNodes = [...nodes].sort((a, b) => axis === 'horizontal' ? a.x - b.x : a.y - b.y);

    const firstNode = sortedNodes[0];
    const lastNode = sortedNodes[sortedNodes.length - 1];

    const totalDistance = axis === 'horizontal'
        ? lastNode.x - firstNode.x
        : lastNode.y - firstNode.y;

    const stepSize = totalDistance / (nodes.length - 1);

    sortedNodes.forEach((node, index) => {
        if (index === 0 || index === sortedNodes.length - 1) return;

        const nodeToUpdate = updatedNodes.find(n => n.id === node.id);
        if (axis === 'horizontal') {
            nodeToUpdate.x = firstNode.x + (stepSize * index);
        } else {
            nodeToUpdate.y = firstNode.y + (stepSize * index);
        }
    });

    return updatedNodes;
};