

/**
 * Exporta el workflow como imagen PNG
 * @param {HTMLElement} container - El elemento contenedor del workflow
 * @param {String} filename - Nombre del archivo a descargar
 */
export const exportAsImage = async (container, filename = 'workflow.png') => {
    if (!container) return;

    try {
        // Crear un canvas a partir del contenedor
        const canvas = await html2canvas(container, {
            scale: 2, // Mayor calidad
            backgroundColor: '#f9fafb',
            logging: false,
            allowTaint: true,
            useCORS: true
        });

        // Convertir a URL de datos
        const imgData = canvas.toDataURL('image/png');

        // Crear link de descarga
        const link = document.createElement('a');
        link.download = filename;
        link.href = imgData;
        link.click();
    } catch (error) {
        console.error('Error al exportar como imagen:', error);
        // Mostrar notificación
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg';
        notification.textContent = 'Error al exportar el workflow como imagen';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
};

/**
 * Exporta el workflow como JSON
 * @param {Object} workflow - Objeto con nodos y conexiones
 * @param {String} filename - Nombre del archivo a descargar
 */
export const exportAsJson = (workflow, filename = 'workflow.json') => {
    try {
        const jsonStr = JSON.stringify(workflow, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.click();

        // Liberar URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
        console.error('Error al exportar como JSON:', error);
        // Mostrar notificación
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg';
        notification.textContent = 'Error al exportar el workflow como JSON';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
};

/**
 * Importa un workflow desde un archivo JSON
 * @param {File} file - Archivo JSON a importar
 * @returns {Promise<Object>} - Objeto con nodos y conexiones
 */
export const importFromJson = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const workflow = JSON.parse(event.target.result);
                resolve(workflow);
            } catch (error) {
                reject(new Error('El archivo no contiene un JSON válido'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Error al leer el archivo'));
        };

        reader.readAsText(file);
    });
};

/**
 * Genera una URL compartible con el workflow
 * @param {Object} workflow - Objeto con nodos y conexiones
 * @returns {String} - URL con el workflow codificado
 */
export const generateShareableUrl = (workflow) => {
    try {
        const jsonStr = JSON.stringify(workflow);
        const encoded = btoa(encodeURIComponent(jsonStr));
        const url = new URL(window.location.href);
        url.searchParams.set('workflow', encoded);
        return url.toString();
    } catch (error) {
        console.error('Error al generar URL compartible:', error);
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