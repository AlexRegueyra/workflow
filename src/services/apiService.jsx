// apiService.js - Servicio para manejar la ejecución de nodos API y el flujo de datos

/**
 * Ejecuta un flujo de trabajo completo
 * @param {Array} nodes - Array de nodos configurados
 * @param {Array} edges - Array de conexiones entre nodos
 * @param {Object} initialData - Datos iniciales (opcional)
 * @returns {Promise<Object>} - Resultados de la ejecución
 */
export const executeWorkflow = async (nodes, edges, initialData = {}) => {
    try {
        // Ordenar nodos por dependencias (topological sort)
        const sortedNodes = sortNodesByDependencies(nodes, edges);

        // Almacenamiento para resultados de ejecución de cada nodo
        const nodeResults = {};
        const nodeStatus = {};
        const executionLog = [];

        // Inicializar con datos iniciales si existen
        if (initialData && Object.keys(initialData).length > 0) {
            const initialNodeId = sortedNodes[0]?.id;
            if (initialNodeId) {
                nodeResults[initialNodeId] = initialData;
            }
        }

        // Ejecutar nodos en orden
        for (const node of sortedNodes) {
            try {
                logExecution(executionLog, node, 'STARTED');
                nodeStatus[node.id] = 'executing';

                // Obtener inputs para este nodo desde nodos anteriores
                const nodeInputs = getNodeInputs(node, edges, nodeResults);

                // Ejecutar el nodo según su tipo
                const result = await executeNode(node, nodeInputs);

                // Guardar resultado
                nodeResults[node.id] = result;
                nodeStatus[node.id] = 'completed';
                logExecution(executionLog, node, 'COMPLETED', result);
            } catch (error) {
                nodeStatus[node.id] = 'error';
                logExecution(executionLog, node, 'ERROR', null, error.message);

                // Verificar si debemos parar todo el workflow o continuar
                if (node.failBehavior === 'stop-workflow') {
                    throw new Error(`Workflow stopped due to error in node ${node.id}: ${error.message}`);
                }
            }
        }

        return {
            success: true,
            results: nodeResults,
            status: nodeStatus,
            executionLog
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            executionLog
        };
    }
};

/**
 * Ordenar nodos por dependencias (topological sort)
 */
const sortNodesByDependencies = (nodes, edges) => {
    const nodeMap = new Map(nodes.map(node => [node.id, { ...node, dependencies: [] }]));

    // Construir grafo de dependencias
    edges.forEach(edge => {
        const targetNode = nodeMap.get(edge.target);
        if (targetNode) {
            targetNode.dependencies.push(edge.source);
        }
    });

    // Algoritmo de ordenación topológica
    const visited = new Set();
    const tempVisited = new Set();
    const result = [];

    function visit(nodeId) {
        if (tempVisited.has(nodeId)) {
            throw new Error('Ciclo detectado en el workflow. No se puede ejecutar.');
        }

        if (visited.has(nodeId)) return;

        tempVisited.add(nodeId);
        const node = nodeMap.get(nodeId);

        if (node) {
            node.dependencies.forEach(depId => visit(depId));
        }

        tempVisited.delete(nodeId);
        visited.add(nodeId);
        result.push(nodeMap.get(nodeId));
    }

    // Visitar todos los nodos
    nodes.forEach(node => {
        if (!visited.has(node.id)) {
            visit(node.id);
        }
    });

    return result.reverse();
};

/**
 * Obtener inputs para un nodo desde nodos anteriores
 */
const getNodeInputs = (node, edges, nodeResults) => {
    const inputs = {};

    // Encontrar todas las conexiones que entran a este nodo
    const incomingEdges = edges.filter(edge => edge.target === node.id);

    incomingEdges.forEach(edge => {
        if (nodeResults[edge.source]) {
            // Si hay una transformación configurada en el edge, aplicarla
            if (edge.transformation) {
                inputs[edge.sourceHandle || 'default'] =
                    applyTransformation(nodeResults[edge.source], edge.transformation);
            } else {
                inputs[edge.sourceHandle || 'default'] = nodeResults[edge.source];
            }
        }
    });

    return inputs;
};

/**
 * Ejecutar un nodo específico basado en su tipo
 */
const executeNode = async (node, inputs) => {
    switch (node.type) {
        case 'api_rest':
            return executeApiNode(node, inputs);
        case 'database':
            return executeDatabaseNode(node, inputs);
        case 'email':
            return executeEmailNode(node, inputs);
        case 'spreadsheet':
            return executeSpreadsheetNode(node, inputs);
        case 'chatbot':
            return executeChatbotNode(node, inputs);
        case 'webhook':
            return executeWebhookNode(node, inputs);
        default:
            throw new Error(`Tipo de nodo no soportado: ${node.type}`);
    }
};

/**
 * Ejecutar un nodo de tipo API REST
 */
const executeApiNode = async (node, inputs) => {
    const { data: configData = {} } = node;

    // Construir la URL con parámetros de query
    let url = configData.url || '';
    const queryParams = {};

    // Procesar variables en la URL usando inputs
    url = processTemplate(url, inputs);

    // Agregar query params si existen
    if (configData.queryParams) {
        Object.entries(configData.queryParams).forEach(([key, value]) => {
            // Procesar template en parámetros
            queryParams[key] = processTemplate(value, inputs);
        });

        // Añadir query params a la URL
        const queryString = new URLSearchParams(queryParams).toString();
        if (queryString) {
            url += (url.includes('?') ? '&' : '?') + queryString;
        }
    }

    // Preparar headers
    let headers = {};
    if (configData.headers) {
        try {
            if (typeof configData.headers === 'string') {
                headers = JSON.parse(processTemplate(configData.headers, inputs));
            } else if (typeof configData.headers === 'object') {
                headers = configData.headers;
            }
        } catch (error) {
            console.error('Error parsing headers:', error);
        }
    }

    // Configurar autenticación
    if (configData.authentication) {
        const auth = configData.authentication;
        switch (auth.type) {
            case 'basic':
                const credentials = `${auth.username}:${auth.password}`;
                headers['Authorization'] = `Basic ${btoa(credentials)}`;
                break;
            case 'bearer':
                headers['Authorization'] = `Bearer ${auth.token}`;
                break;
            case 'apiKey':
                if (auth.in === 'header') {
                    headers[auth.name] = auth.value;
                } else if (auth.in === 'query') {
                    url += (url.includes('?') ? '&' : '?') +
                        `${encodeURIComponent(auth.name)}=${encodeURIComponent(auth.value)}`;
                }
                break;
        }
    }

    // Preparar body si es necesario
    let body = null;
    if (['POST', 'PUT', 'PATCH'].includes(configData.method)) {
        if (configData.bodyType === 'raw' && configData.body) {
            body = processTemplate(configData.body, inputs);
        } else if (configData.bodyType === 'json' && configData.jsonBody) {
            // Para body JSON, permitimos procesamiento de templates en cada valor
            if (typeof configData.jsonBody === 'string') {
                try {
                    const jsonObj = JSON.parse(configData.jsonBody);
                    body = JSON.stringify(processObjectTemplates(jsonObj, inputs));
                } catch (e) {
                    throw new Error(`Invalid JSON body: ${e.message}`);
                }
            } else if (typeof configData.jsonBody === 'object') {
                body = JSON.stringify(processObjectTemplates(configData.jsonBody, inputs));
            }

            // Asegurarse que el Content-Type es application/json
            headers['Content-Type'] = 'application/json';
        } else if (configData.bodyType === 'form' && configData.formData) {
            const formData = new FormData();
            Object.entries(configData.formData).forEach(([key, value]) => {
                formData.append(key, processTemplate(String(value), inputs));
            });
            body = formData;
            // No establecer Content-Type para FormData, fetch lo hace automáticamente
        }
    }

    // Configurar opciones del request
    const requestOptions = {
        method: configData.method || 'GET',
        headers,
        timeout: configData.timeout || 30000,
    };

    if (body) {
        requestOptions.body = body;
    }

    // Ejecutar la petición con manejo de timeout
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestOptions.timeout);
    requestOptions.signal = controller.signal;

    try {
        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        // Manejar respuesta según tipo de contenido
        const contentType = response.headers.get('Content-Type') || '';
        let responseData;

        if (contentType.includes('application/json')) {
            responseData = await response.json();
        } else if (contentType.includes('text/')) {
            responseData = await response.text();
        } else {
            // Para otros tipos, devolver un ArrayBuffer
            responseData = await response.arrayBuffer();
        }

        // Incluir metadata de la respuesta
        return {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            data: responseData,
            ok: response.ok
        };
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error(`API request timeout after ${requestOptions.timeout}ms`);
        }
        throw error;
    }
};

/**
 * Ejecutar nodo de base de datos (implementación básica)
 */
const executeDatabaseNode = async (node, inputs) => {
    // Esta es una implementación simulada
    // En un entorno real, usarías una biblioteca de conexión a base de datos
    const { data: configData = {} } = node;

    // Procesar la consulta SQL con los inputs
    const query = processTemplate(configData.query, inputs);

    console.log(`[DB Simulation] Executing query on ${configData.type}:`, query);

    // Simulamos una respuesta
    return {
        success: true,
        rows: [],
        affectedRows: 0,
        query
    };
};

/**
 * Ejecutar nodo de email (implementación básica)
 */
const executeEmailNode = async (node, inputs) => {
    const { data: configData = {} } = node;

    // Procesar campos de email con inputs
    const to = processTemplate(configData.to, inputs);
    const subject = processTemplate(configData.subject, inputs);
    const body = processTemplate(configData.body, inputs);

    console.log(`[Email Simulation] Sending email to ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);

    // En implementación real, usarías un servicio de email
    return {
        success: true,
        to,
        subject,
        sentAt: new Date().toISOString()
    };
};

/**
 * Ejecutar nodo de hoja de cálculo (implementación básica)
 */
const executeSpreadsheetNode = async (node, inputs) => {
    // Implementación simulada
    return {
        success: true,
        rowCount: 0,
        message: 'Spreadsheet operation simulated'
    };
};

/**
 * Ejecutar nodo de chatbot (implementación básica)
 */
const executeChatbotNode = async (node, inputs) => {
    // Implementación simulada
    return {
        success: true,
        message: 'Chatbot message sent'
    };
};

/**
 * Ejecutar nodo de webhook (implementación básica)
 */
const executeWebhookNode = async (node, inputs) => {
    const { data: configData = {} } = node;
    const url = processTemplate(configData.url, inputs);

    // Preparar payload
    const payload = processObjectTemplates(configData.payload || inputs, inputs);

    console.log(`[Webhook Simulation] Sending to ${url}`);

    // En implementación real, harías un fetch aquí
    return {
        success: true,
        url,
        sentAt: new Date().toISOString()
    };
};

/**
 * Aplicar transformación a los datos
 */
const applyTransformation = (data, transformation) => {
    try {
        switch (transformation.type) {
            case 'filter':
                return applyFilterTransformation(data, transformation.config);
            case 'map':
                return applyMapTransformation(data, transformation.config);
            case 'reduce':
                return applyReduceTransformation(data, transformation.config);
            case 'aggregate':
                return applyAggregateTransformation(data, transformation.config);
            default:
                return data;
        }
    } catch (error) {
        console.error('Error applying transformation:', error);
        return data;
    }
};

/**
 * Aplicar transformación de filtrado
 */
const applyFilterTransformation = (data, config) => {
    if (!Array.isArray(data)) {
        if (data.data && Array.isArray(data.data)) {
            data = data.data;
        } else {
            return data;
        }
    }

    const { field, operator, value } = config;

    return data.filter(item => {
        const fieldValue = getNestedValue(item, field);

        switch (operator) {
            case 'equals':
                return fieldValue == value;
            case 'notEquals':
                return fieldValue != value;
            case 'contains':
                return String(fieldValue).includes(String(value));
            case 'greaterThan':
                return fieldValue > value;
            case 'lessThan':
                return fieldValue < value;
            case 'exists':
                return fieldValue !== undefined && fieldValue !== null;
            default:
                return true;
        }
    });
};

/**
 * Aplicar transformación de mapeo
 */
const applyMapTransformation = (data, config) => {
    if (!Array.isArray(data)) {
        if (data.data && Array.isArray(data.data)) {
            data = data.data;
        } else if (typeof data === 'object') {
            // Si es un objeto, lo transformamos según el mapping
            return mapObjectProperties(data, config.mapping);
        } else {
            return data;
        }
    }

    // Para arrays, aplicamos el mapping a cada elemento
    return data.map(item => mapObjectProperties(item, config.mapping));
};

/**
 * Mapear propiedades de un objeto según configuración
 */
const mapObjectProperties = (obj, mapping) => {
    if (!mapping || typeof mapping !== 'object') {
        return obj;
    }

    const result = {};

    Object.entries(mapping).forEach(([targetKey, sourceConfig]) => {
        if (typeof sourceConfig === 'string') {
            // Mapping directo: "newName": "oldName"
            result[targetKey] = getNestedValue(obj, sourceConfig);
        } else if (typeof sourceConfig === 'object') {
            // Mapping con transformación
            const value = getNestedValue(obj, sourceConfig.field);

            if (sourceConfig.transform) {
                switch (sourceConfig.transform) {
                    case 'toString':
                        result[targetKey] = String(value);
                        break;
                    case 'toNumber':
                        result[targetKey] = Number(value);
                        break;
                    case 'toBoolean':
                        result[targetKey] = Boolean(value);
                        break;
                    case 'toDate':
                        result[targetKey] = new Date(value).toISOString();
                        break;
                    default:
                        result[targetKey] = value;
                }
            } else {
                result[targetKey] = value;
            }
        }
    });

    return result;
};

/**
 * Aplicar transformación de reducción
 */
const applyReduceTransformation = (data, config) => {
    if (!Array.isArray(data)) {
        if (data.data && Array.isArray(data.data)) {
            data = data.data;
        } else {
            return data;
        }
    }

    const { initialValue, operation } = config;

    return data.reduce((acc, item) => {
        const value = getNestedValue(item, config.field);

        switch (operation) {
            case 'sum':
                return acc + (Number(value) || 0);
            case 'multiply':
                return acc * (Number(value) || 1);
            case 'concat':
                return String(acc) + String(value || '');
            case 'countTrue':
                return acc + (value ? 1 : 0);
            case 'min':
                return Math.min(acc, Number(value) || Infinity);
            case 'max':
                return Math.max(acc, Number(value) || -Infinity);
            default:
                return acc;
        }
    }, initialValue !== undefined ? initialValue : 0);
};

/**
 * Aplicar transformación de agregación
 */
const applyAggregateTransformation = (data, config) => {
    if (!Array.isArray(data)) {
        if (data.data && Array.isArray(data.data)) {
            data = data.data;
        } else {
            return data;
        }
    }

    const { groupBy, aggregations } = config;

    // Agrupar datos
    const groups = data.reduce((acc, item) => {
        const groupKey = getNestedValue(item, groupBy);
        const key = String(groupKey);

        if (!acc[key]) {
            acc[key] = [];
        }

        acc[key].push(item);
        return acc;
    }, {});

    // Aplicar agregaciones a cada grupo
    return Object.entries(groups).map(([groupKey, items]) => {
        const result = { [groupBy.split('.').pop()]: groupKey };

        aggregations.forEach(agg => {
            switch (agg.operation) {
                case 'count':
                    result[agg.resultField] = items.length;
                    break;
                case 'sum':
                    result[agg.resultField] = items.reduce(
                        (sum, item) => sum + (Number(getNestedValue(item, agg.field)) || 0), 0
                    );
                    break;
                case 'avg':
                    result[agg.resultField] = items.reduce(
                        (sum, item) => sum + (Number(getNestedValue(item, agg.field)) || 0), 0
                    ) / (items.length || 1);
                    break;
                case 'min':
                    result[agg.resultField] = Math.min(
                        ...items.map(item => Number(getNestedValue(item, agg.field)) || Infinity)
                    );
                    break;
                case 'max':
                    result[agg.resultField] = Math.max(
                        ...items.map(item => Number(getNestedValue(item, agg.field)) || -Infinity)
                    );
                    break;
                case 'first':
                    result[agg.resultField] = getNestedValue(items[0], agg.field);
                    break;
                case 'last':
                    result[agg.resultField] = getNestedValue(items[items.length - 1], agg.field);
                    break;
            }
        });

        return result;
    });
};

/**
 * Obtener valor anidado de un objeto usando notación de punto
 */
const getNestedValue = (obj, path) => {
    if (!obj || !path) return undefined;

    const keys = path.split('.');
    let value = obj;

    for (const key of keys) {
        if (value === null || value === undefined) return undefined;
        value = value[key];
    }

    return value;
};

/**
 * Procesar plantillas en strings usando datos de entrada
 * Ejemplo: "Hola {{name}}" -> "Hola Juan" si inputs.name = "Juan"
 */
const processTemplate = (template, inputs) => {
    if (!template || typeof template !== 'string') return template;

    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const value = getNestedValue(inputs, path.trim());
        return value !== undefined ? String(value) : match;
    });
};

/**
 * Procesar plantillas en un objeto completo recursivamente
 */
const processObjectTemplates = (obj, inputs) => {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => processObjectTemplates(item, inputs));
    }

    const result = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            result[key] = processTemplate(value, inputs);
        } else if (typeof value === 'object' && value !== null) {
            result[key] = processObjectTemplates(value, inputs);
        } else {
            result[key] = value;
        }
    }

    return result;
};

/**
 * Registrar evento de ejecución
 */
const logExecution = (executionLog, node, status, result = null, errorMessage = null) => {
    executionLog.push({
        nodeId: node.id,
        nodeName: node.data?.label || node.type,
        timestamp: new Date().toISOString(),
        status,
        result: status === 'COMPLETED' ? summarizeResult(result) : null,
        error: errorMessage
    });
};

/**
 * Resumir resultado para log (para evitar objetos muy grandes)
 */
const summarizeResult = (result) => {
    if (!result) return null;

    if (Array.isArray(result)) {
        return {
            type: 'array',
            length: result.length,
            sample: result.slice(0, 3)
        };
    }

    if (typeof result === 'object') {
        return {
            type: 'object',
            keys: Object.keys(result),
            summary: Object.entries(result).slice(0, 5).reduce((acc, [k, v]) => {
                acc[k] = typeof v === 'object' ? '[Object]' : v;
                return acc;
            }, {})
        };
    }

    return result;
};