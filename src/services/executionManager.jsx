// executionManager.js
import axios from 'axios';

/**
 * Clase que maneja la ejecución de workflows y la integración con APIs reales
 */
export class ExecutionManager {
    constructor() {
        // Registro de ejecuciones activas
        this.activeExecutions = new Map();

        // Listeners de eventos
        this.eventListeners = new Map();

        // Cache de respuestas para desarrollo/pruebas
        this.responseCache = new Map();
    }

    /**
     * Ejecuta un workflow completo
     * @param {Object} workflow - Definición del workflow (nodos y conexiones)
     * @param {Object} options - Opciones de ejecución
     * @returns {Promise<Object>} - Resultados de la ejecución
     */
    async executeWorkflow(workflow, options = {}) {
        const { nodes, edges } = workflow;
        const { initialInputs = {}, abortSignal, useCache = false } = options;

        // Generar ID único para esta ejecución
        const executionId = this.generateExecutionId();

        // Registrar ejecución activa
        this.activeExecutions.set(executionId, {
            startTime: Date.now(),
            status: 'running',
            workflow,
            options,
            results: {},
            nodeStatus: {},
            logs: []
        });

        // Publicar evento de inicio
        this.publishEvent({
            type: 'workflow-start',
            executionId,
            totalNodes: nodes.length,
            timestamp: new Date().toISOString()
        });

        try {
            // Ordenar nodos para ejecución basada en dependencias
            const sortedNodes = this.sortNodesByDependency(nodes, edges);

            // Resultados parciales por nodo
            const nodeResults = {};

            // Inicializar con datos de entrada si existen
            if (initialInputs && Object.keys(initialInputs).length > 0) {
                // Si hay un nodo inicial definido, usamos ese
                const startNode = sortedNodes[0];
                if (startNode) {
                    nodeResults[startNode.id] = initialInputs;
                }
            }

            // Ejecutar nodos en orden
            for (const node of sortedNodes) {
                // Verificar si se solicitó cancelación
                if (abortSignal && abortSignal.aborted) {
                    throw new Error('Execution aborted by user');
                }

                // Actualizar estado de nodo
                this.updateExecutionNodeStatus(executionId, node.id, 'running');

                // Publicar evento de inicio de nodo
                this.publishEvent({
                    type: 'node-start',
                    executionId,
                    nodeId: node.id,
                    nodeType: node.type,
                    timestamp: new Date().toISOString()
                });

                try {
                    // Obtener inputs para este nodo basado en conexiones anteriores
                    const nodeInputs = this.resolveNodeInputs(node, edges, nodeResults);

                    // Ejecutar nodo según su tipo
                    let result;

                    // Verificar caché si está habilitado
                    const cacheKey = useCache ? this.generateNodeCacheKey(node, nodeInputs) : null;
                    const cachedResult = useCache ? this.responseCache.get(cacheKey) : null;

                    if (useCache && cachedResult) {
                        result = cachedResult;
                        this.logExecution(executionId, node, 'Usando resultado en caché');
                    } else {
                        // Ejecutar el nodo según su tipo
                        result = await this.executeNode(node, nodeInputs, { abortSignal });
                        console.log(`Resultado de nodo ${node.id} (${node.type}):`, JSON.stringify(result, null, 2));
                        // Guardar en caché si es necesario
                        if (useCache && cacheKey && result && !result.error) {
                            this.responseCache.set(cacheKey, result);
                        }
                    }

                    // Guardar resultado para uso posterior
                    nodeResults[node.id] = result;

                    // Actualizar estado de nodo
                    this.updateExecutionNodeStatus(executionId, node.id, 'completed');

                    // Publicar evento de finalización de nodo
                    this.publishEvent({
                        type: 'node-complete',
                        executionId,
                        nodeId: node.id,
                        timestamp: new Date().toISOString(),
                        result: this.summarizeResult(result)
                    });
                } catch (error) {
                    // Actualizar estado de nodo
                    this.updateExecutionNodeStatus(executionId, node.id, 'error');

                    // Publicar evento de error
                    this.publishEvent({
                        type: 'node-error',
                        executionId,
                        nodeId: node.id,
                        timestamp: new Date().toISOString(),
                        error: error.message
                    });

                    // Si el nodo está configurado para detener el workflow en error, detenemos
                    if (node.data?.config?.failBehavior === 'stop-workflow') {
                        throw new Error(`Error en nodo ${node.id}: ${error.message}`);
                    }

                    // De lo contrario, continuamos con el siguiente nodo
                    this.logExecution(executionId, node, 'Error en ejecución', error.message);
                }

                // Publicar progreso
                const completedCount = Object.values(this.activeExecutions.get(executionId).nodeStatus)
                    .filter(status => ['completed', 'error'].includes(status)).length;

                const progress = Math.round((completedCount / nodes.length) * 100);

                this.publishEvent({
                    type: 'workflow-progress',
                    executionId,
                    progress,
                    completedNodes: completedCount,
                    totalNodes: nodes.length,
                    timestamp: new Date().toISOString()
                });
            }

            // Actualizar ejecución como completada
            const execution = this.activeExecutions.get(executionId);
            execution.status = 'completed';
            execution.results = nodeResults;
            execution.endTime = Date.now();

            // Publicar evento de finalización
            this.publishEvent({
                type: 'workflow-complete',
                executionId,
                timestamp: new Date().toISOString(),
                duration: execution.endTime - execution.startTime,
                results: this.summarizeResults(nodeResults)
            });

            // Devolver resultados
            return {
                success: true,
                executionId,
                results: nodeResults,
                logs: execution.logs,
                duration: execution.endTime - execution.startTime
            };

        } catch (error) {
            // Actualizar ejecución como fallida
            const execution = this.activeExecutions.get(executionId);
            execution.status = 'failed';
            execution.error = error.message;
            execution.endTime = Date.now();

            // Publicar evento de error
            this.publishEvent({
                type: 'workflow-error',
                executionId,
                timestamp: new Date().toISOString(),
                error: error.message,
                duration: execution.endTime - execution.startTime
            });

            return {
                success: false,
                executionId,
                error: error.message,
                logs: execution.logs,
                duration: execution.endTime - execution.startTime
            };
        }
    }


    /**
  * Ejecuta un nodo específico según su tipo
  */
    async executeNode(node, inputs, options = {}) {
        const { type } = node;
        const config = node.data?.config || {};

        switch (type) {
            case 'api_rest':
                return this.executeApiRestNode(node, inputs, options);
            case 'database':
                return this.executeDatabaseNode(node, inputs, options);
            case 'email':
                return this.executeEmailNode(node, inputs, options);
            case 'spreadsheet':
                return this.executeSpreadsheetNode(node, inputs, options);
            case 'chatbot':
                return this.executeChatbotNode(node, inputs, options);
            case 'webhook':
                return this.executeWebhookNode(node, inputs, options);
            case 'conditional':
                return this.executeConditionalNode(node, inputs, options);
            case 'transformer':
                return this.executeTransformerNode(node, inputs, options);
            default:
                throw new Error(`Tipo de nodo no soportado: ${type}`);
        }
    }

    /**
     * Ejecuta un nodo de tipo API REST usando ApiService
     */
    async executeApiRestNode(node, inputs = {}) {
        const config = node.data?.config || node.config || {};

        try {
            const fetchOptions = {
                method: config.method || 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            };

            // Agregar headers personalizados si existen
            if (config.headers) {
                const parsedHeaders = typeof config.headers === 'string'
                    ? JSON.parse(config.headers)
                    : config.headers;

                Object.entries(parsedHeaders).forEach(([key, value]) => {
                    fetchOptions.headers[key] = value;
                });
            }

            // Manejar autenticación
            if (config.authentication && config.authentication !== 'Ninguno') {
                switch (config.authentication) {
                    case 'Básica':
                        const credentials = `${config.authConfig.username}:${config.authConfig.password}`;
                        fetchOptions.headers['Authorization'] = `Basic ${btoa(credentials)}`;
                        break;
                    case 'Bearer':
                        fetchOptions.headers['Authorization'] = `Bearer ${config.authConfig.token}`;
                        break;
                    case 'API Key':
                        const { keyName, keyValue, keyLocation } = config.authConfig;
                        if (keyLocation === 'header') {
                            fetchOptions.headers[keyName] = keyValue;
                        }
                        break;
                }
            }

            // Agregar body para métodos que lo requieren
            if (['POST', 'PUT', 'PATCH'].includes(config.method)) {
                fetchOptions.body = typeof config.body === 'string'
                    ? config.body
                    : JSON.stringify(config.body);
            }

            // Realizar la petición
            const response = await fetch(config.url, fetchOptions);

            // Obtener texto de error si no es exitoso
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                return {
                    status: response.status,
                    ok: false,
                    error: errorText,
                    data: null
                };
            }

            // Parsear respuesta
            const responseData = await response.json();
            return {
                status: response.status,
                ok: true,
                data: responseData,
                headers: Object.fromEntries(response.headers.entries())
            };
        } catch (error) {
            console.error('Fetch error details:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            });

            return {
                status: 500,
                ok: false,
                error: error.message,
                data: null
            };
        }
    }
/**
 * Ejecuta un nodo de base de datos utilizando el servicio API
 */
async executeDatabaseNode(node, inputs, options = {}) {
    const config = node.data?.config || {};

    console.log(`[Database] Ejecutando operación en ${config.type || 'base de datos'}`);
    
    // Crear copia segura de la configuración para logs (ocultar contraseña)
    const safeConfig = { ...config };
    if (safeConfig.password) {
        safeConfig.password = '********';
    }
    
    console.log('[DEBUG] Configuración DB:', JSON.stringify(safeConfig, null, 2));
    console.log('[DEBUG] Inputs recibidos:', JSON.stringify(inputs, null, 2).substring(0, 500) + '...');

    try {
        // Validar configuración mínima
        if (!config.type || !config.host || !config.database) {
            return {
                success: false,
                error: 'Configuración incompleta. Se requiere tipo, host y base de datos.',
                data: null
            };
        }

        // Procesar la consulta SQL para reemplazar variables
        let processedQuery = config.query || '';

        // Extraer variables de la consulta (formato {{variable}})
        const variableMatches = processedQuery.match(/{{([^}]+)}}/g) || [];

        // Reemplazar variables con valores de los inputs
        for (const match of variableMatches) {
            const variableName = match.replace(/{{|}}/g, '');
            let variableValue = '';

            // Navegar en la estructura de inputs para encontrar el valor
            if (inputs && typeof inputs === 'object') {
                // Caso 1: input.default es un array
                if (inputs.default && Array.isArray(inputs.default)) {
                    if (inputs.default.length > 0) {
                        const firstItem = inputs.default[0];

                        // Buscar en diferentes niveles: directo, .data, .default
                        if (firstItem[variableName] !== undefined) {
                            variableValue = firstItem[variableName];
                        } else if (firstItem.data && firstItem.data[variableName] !== undefined) {
                            variableValue = firstItem.data[variableName];
                        } else if (firstItem.default && firstItem.default[variableName] !== undefined) {
                            variableValue = firstItem.default[variableName];
                        }
                    }
                }
                // Caso 2: input.default es un objeto
                else if (inputs.default && typeof inputs.default === 'object') {
                    if (inputs.default[variableName] !== undefined) {
                        variableValue = inputs.default[variableName];
                    } else if (inputs.default.data && inputs.default.data[variableName] !== undefined) {
                        variableValue = inputs.default.data[variableName];
                    }
                }
                // Caso 3: buscar en el input directo
                else if (inputs[variableName] !== undefined) {
                    variableValue = inputs[variableName];
                }
            }

            // Reemplazar en la consulta (asegurar que sea string)
            processedQuery = processedQuery.replace(match, String(variableValue));
        }

        console.log(`[Database] Consulta procesada: ${processedQuery}`);

        // Importar el servicio de API 
        // Nota: esta importación está hecha de manera estática al principio del archivo
        // import dbApiService from './services/dbApiService';

        // Para mantener compatibilidad con el código existente, verificamos si el servicio existe
        if (typeof dbApiService !== 'undefined') {
            // Usar el servicio API para ejecutar la consulta
            try {
                const resultado = await dbApiService.executeQuery(config, processedQuery);
                
                return {
                    success: resultado.success,
                    data: resultado.data,
                    message: resultado.message || 'Operación completada',
                    metadata: {
                        dbType: config.type,
                        operation: resultado.operation || 'query',
                        rowsAffected: resultado.rowsAffected || (Array.isArray(resultado.data) ? resultado.data.length : 0)
                    }
                };
            } catch (apiError) {
                console.error(`[Database] Error en API:`, apiError);
                return {
                    success: false,
                    error: apiError.message,
                    data: null
                };
            }
        } else {
            // Si el servicio API no está disponible, usar simulación
            console.log('[Database] Servicio API no disponible, usando simulación');
            const resultado = await this.simulateDatabaseQuery(config, processedQuery, inputs);
            
            return {
                success: true,
                data: resultado,
                message: resultado.message || 'Operación completada',
                metadata: {
                    dbType: config.type,
                    operation: resultado.operation || 'query',
                    rowsAffected: resultado.rowsAffected || resultado.data?.length || 0
                }
            };
        }
    } catch (error) {
        console.error(`[Database] Error: ${error.message}`);
        return {
            success: false,
            error: error.message,
            data: null
        };
    }
}

    /**
     * Ejecuta un nodo de email (simulado)
     */
    async executeEmailNode(node, inputs, options = {}) {
        const config = node.data?.config || {};

        // Procesar campos de email con inputs
        const to = this.processTemplate(config.to || '', inputs);
        const subject = this.processTemplate(config.subject || '', inputs);
        const body = this.processTemplate(config.body || '', inputs);

        console.log(`[Email Simulation] Sending email to ${to}`);
        console.log(`Subject: ${subject}`);

        // Simular envío
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            success: true,
            to,
            subject,
            sentAt: new Date().toISOString(),
            metadata: {
                messageId: `${Date.now()}.${Math.random().toString(36).substring(2)}@workflow.local`,
                size: body.length
            }
        };
    }

    /**
     * Ejecuta un nodo de hoja de cálculo con implementación real
     */
    async executeSpreadsheetNode(node, inputs, options = {}) {
        const config = node.data?.config || {};
        console.log("Configuración completa del nodo:", config);
        const serverUrl = 'http://localhost:3001'; // O la URL de tu servidor

        try {
            // Log para depuración
            console.log("Ejecutando nodo de hoja de cálculo con config:", config);

            switch (config.serviceType) {
                case 'google':
                    return await this.executeGoogleSheetsOperation(config, serverUrl);

                case 'excel_online':
                    return await this.executeExcelOnlineOperation(config, serverUrl);

                case 'excel_file':
                    return await this.executeExcelFileOperation(config, serverUrl);

                case 'csv':
                    return await this.executeCSVOperation(config, serverUrl);

                case 'mock':
                    return await this.executeMock(config, serverUrl);

                default:
                    throw new Error('Tipo de servicio no soportado');
            }
        } catch (error) {
            console.error('Error executing spreadsheet operation:', error);
            return {
                success: false,
                message: `Error: ${error.message}`,
                error: error.toString()
            };
        }
    }

    // Métodos auxiliares
    async executeGoogleSheetsOperation(config, serverUrl) {
        try {
            const response = await axios.post(`${serverUrl}/api/spreadsheet/google-sheets`, config);
            return response.data;
        } catch (error) {
            console.error('Error en Google Sheets:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message
            };
        }
    }

    async executeExcelOnlineOperation(config, serverUrl) {
        try {
            const response = await axios.post(`${serverUrl}/api/spreadsheet/excel-online`, config);
            return response.data;
        } catch (error) {
            console.error('Error en Excel Online:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message
            };
        }
    }

    async executeExcelFileOperation(config, serverUrl) {
        try {
            // Verificar que config tiene filePath
            if (!config.filePath) {
                console.error("executeExcelFileOperation: No se encontró filePath en la configuración", config);
                return {
                    success: false,
                    message: "Ruta de archivo no especificada. Asegúrese de haber subido un archivo."
                };
            }

            console.log("Enviando petición a Excel File con config:", config);

            const response = await axios.post(`${serverUrl}/api/spreadsheet/excel-file`, config);
            console.log("Respuesta de Excel File:", response.data);
            return response.data;
        } catch (error) {
            console.error('Error en Excel File:', error);

            // Mensaje detallado para depuración
            let errorMsg = error.message;
            if (error.response && error.response.data) {
                errorMsg = error.response.data.message || errorMsg;
                console.error("Detalles del error:", error.response.data);
            }

            return {
                success: false,
                message: errorMsg
            };
        }
    }

    async executeCSVOperation(config, serverUrl) {
        try {
            const response = await axios.post(`${serverUrl}/api/spreadsheet/csv`, config);
            return response.data;
        } catch (error) {
            console.error('Error en CSV:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message
            };
        }
    }
    async executeMock(config, serverUrl) {
        try {
            const response = await axios.post(`${serverUrl}/api/spreadsheet/mock`, config);
            return response.data;
        } catch (error) {
            console.error('Error en mock:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message
            };
        }
    }

    /**
     * Ejecuta un nodo de chatbot (simulado)
     */
    async executeChatbotNode(node, inputs, options = {}) {
        const config = node.data?.config || {};

        // Procesar mensaje con inputs
        const message = this.processTemplate(config.message || 'Mensaje automático', inputs);

        await new Promise(resolve => setTimeout(resolve, 600));

        return {
            success: true,
            message,
            sentAt: new Date().toISOString(),
            metadata: {
                platform: config.platform,
                responseType: config.responseType
            }
        };
    }

    /**
     * Ejecuta un nodo de webhook (simulado)
     */

    async executeWebhookNode(node, inputs, options = {}) {
        const config = node.data?.config || {};
        const url = this.processTemplate(config.url || '', inputs);

        // Preparar payload 
        let payload = {};

        // Si hay una configuración de payload específica
        if (config.payload) {
            // Procesar cada campo del payload
            Object.entries(config.payload).forEach(([key, template]) => {
                payload[key] = this.processTemplate(template, inputs.default || inputs);
            });
        } else {
            // Usar los inputs directamente si no hay configuración específica
            payload = inputs.default || inputs;
        }

        console.log(`[Webhook Simulation] Sending to ${url}`);
        console.log('[DEBUG] Payload completo:', JSON.stringify(payload, null, 2));

        return {
            success: true,
            url,
            sentAt: new Date().toISOString(),
            payload, // Incluir payload procesado
            metadata: {
                method: config.method || 'POST',
                payloadSize: JSON.stringify(payload).length
            }
        };
    }

    /**
     * Ejecuta un nodo de tipo condicional
     */

    async executeConditionalNode(node, inputs, options = {}) {
        const config = node.data?.config || {};
        const { field, operator, value } = config;

        console.log("🔍 Inputs COMPLETOS al nodo condicional:", JSON.stringify(inputs, null, 2));

        /**
         * Función mejorada para obtener valores anidados con manejo especial
         * para la estructura específica del workflow
         */
        const getNestedValue = (obj, path) => {
            // Caso especial: CustomResponse.campo cuando inputs.default es array
            if (path.startsWith("CustomResponse.") && obj.default && Array.isArray(obj.default)) {
                const fieldName = path.replace("CustomResponse.", "");

                // Si hay elementos en el array default, buscar el valor en el primer elemento
                if (obj.default.length > 0 && obj.default[0] && fieldName in obj.default[0]) {
                    return obj.default[0][fieldName];
                }
            }

            // Si el path está vacío, retornar el objeto completo
            if (!path || path === '') return obj;

            // Normalizar la ruta (tratar CustomResponse y notación de arrays)
            const normalizedPath = path
                .replace(/^CustomResponse\./, '')      // Eliminar prefijo CustomResponse
                .replace(/\[(\w+)\]/g, '.$1');         // Convertir notación array[key] a array.key

            // Separar por puntos para obtener un array de keys
            const keys = normalizedPath.split('.');

            // Punto de entrada para búsqueda recursiva
            let value = obj;

            // Si tenemos data.CustomResponse en el objeto, comenzar ahí para campos con prefijo CustomResponse
            if (path.startsWith('CustomResponse.') &&
                obj.data &&
                obj.data.CustomResponse) {

                // Si CustomResponse es un array, tomar el primer elemento
                if (Array.isArray(obj.data.CustomResponse)) {
                    if (obj.data.CustomResponse.length > 0) {
                        const fieldWithoutPrefix = path.replace('CustomResponse.', '');
                        const firstItem = obj.data.CustomResponse[0];

                        if (firstItem && fieldWithoutPrefix in firstItem) {
                            return firstItem[fieldWithoutPrefix];
                        }
                    }
                } else {
                    // CustomResponse es un objeto, buscar directamente
                    value = obj.data.CustomResponse;
                }
            }

            // Manejar caso específico: si tenemos default como array y buscamos propiedades simples
            if (obj.default && Array.isArray(obj.default) && obj.default.length > 0) {
                // Si el primer elemento tiene la propiedad que buscamos, usarlo
                const firstItem = obj.default[0];
                if (firstItem && keys[0] in firstItem) {
                    value = firstItem;
                }
            }

            // Navegación a través de las claves
            for (const key of keys) {
                // Si el valor es null o undefined, detener la navegación
                if (value === null || value === undefined) return undefined;

                // Si el valor actual tiene un CustomResponse, intentar buscar ahí
                if (value.CustomResponse) {
                    // Si CustomResponse es un array, buscar en el primer elemento
                    if (Array.isArray(value.CustomResponse) && value.CustomResponse.length > 0) {
                        if (key in value.CustomResponse[0]) {
                            value = value.CustomResponse[0][key];
                            continue;
                        }
                    } else if (key in value.CustomResponse) {
                        // CustomResponse es un objeto
                        value = value.CustomResponse[key];
                        continue;
                    }
                }

                // Búsqueda normal en el objeto actual
                value = value[key];
            }

            return value;
        };

        /**
         * Compara valores con manejo inteligente de tipos
         */
        const compareValues = (actual, expected, op) => {
            // Si los valores son undefined o null, manejarlos de forma especial
            if (actual === undefined || actual === null) {
                if (op === 'exists') return false;
                if (op === 'notEquals') return expected !== null && expected !== undefined;
                return false;
            }

            // Convertir a string para operaciones de texto
            const actualStr = String(actual);
            const expectedStr = expected !== undefined ? String(expected) : '';

            // Normalizar valores numéricos para comparaciones numéricas
            const actualNum = Number(actual);
            const expectedNum = Number(expected);

            switch (op) {
                case 'equals':
                    // Intentar igualdad estricta primero
                    if (actual === expected) return true;
                    // Para números, comparar valores numéricos
                    if (!isNaN(actualNum) && !isNaN(expectedNum)) {
                        return actualNum === expectedNum;
                    }
                    // Para cadenas, comparar después de normalizar
                    return actualStr === expectedStr;

                case 'notEquals':
                    // Intentar desigualdad estricta primero
                    if (actual !== expected) return true;
                    // Para números, comparar valores numéricos
                    if (!isNaN(actualNum) && !isNaN(expectedNum)) {
                        return actualNum !== expectedNum;
                    }
                    // Para cadenas, comparar después de normalizar
                    return actualStr !== expectedStr;

                case 'contains':
                    // Para arrays, verificar si el valor está en el array
                    if (Array.isArray(actual)) {
                        return actual.some(item => String(item) === expectedStr);
                    }
                    // Para objetos, verificar si alguna propiedad coincide
                    if (typeof actual === 'object' && actual !== null) {
                        return Object.values(actual).some(val =>
                            String(val) === expectedStr
                        );
                    }
                    // Para strings, usar includes
                    return actualStr.includes(expectedStr);

                case 'greaterThan':
                    return !isNaN(actualNum) && !isNaN(expectedNum) && actualNum > expectedNum;

                case 'lessThan':
                    return !isNaN(actualNum) && !isNaN(expectedNum) && actualNum < expectedNum;

                case 'exists':
                    if (Array.isArray(actual)) return actual.length > 0;
                    if (typeof actual === 'object' && actual !== null) return Object.keys(actual).length > 0;
                    return true; // Si llegamos aquí, el valor existe

                case 'startsWith':
                    return actualStr.startsWith(expectedStr);

                case 'endsWith':
                    return actualStr.endsWith(expectedStr);

                default:
                    console.warn(`⚠️ Operador no reconocido: ${op}`);
                    return false;
            }
        };

        try {
            // Obtener el valor a evaluar con el manejo especial para la estructura
            const fieldValue = getNestedValue(inputs, field);

            // Registrar información detallada para depuración
            console.log(`🧐 Detalles de evaluación de condición:`, {
                field,
                operator,
                expectedValue: value,
                actualValue: fieldValue,
                actualType: typeof fieldValue,
                isArray: Array.isArray(fieldValue),
                hasDefault: !!inputs.default,
                defaultIsArray: Array.isArray(inputs.default),
                defaultLength: Array.isArray(inputs.default) ? inputs.default.length : 0,
                inputKeys: Object.keys(inputs)
            });

            // Evaluar la condición
            const conditionResult = compareValues(fieldValue, value, operator);

            // Devolver resultado con metadatos detallados
            return {
                success: true,
                result: conditionResult,
                condition: {
                    field,
                    operator,
                    expectedValue: value,
                    actualValue: fieldValue,
                    actualType: typeof fieldValue,
                    isArray: Array.isArray(fieldValue)
                },
                // Incluir los datos originales para que estén disponibles en los siguientes nodos
                data: inputs
            };
        } catch (error) {
            // Manejar errores de forma detallada
            console.error('❌ Error en evaluación condicional:', error);

            return {
                success: false,
                error: {
                    message: error.message,
                    stack: error.stack,
                    code: error.code
                },
                result: false, // Por defecto, la condición falla en caso de error
                condition: {
                    field,
                    operator,
                    expectedValue: value
                },
                data: inputs // Mantener los datos para el flujo de error
            };
        }
    }

    /**
     * Ejecuta un nodo de tipo transformador
     */
    async executeTransformerNode(node, inputs, options = {}) {
        const config = node.data?.config || {};
        console.log(`[Transformer] Aplicando transformación de tipo ${config.transformType}`);
        console.log('[DEBUG] Ejecutando transformador', {
            transformType: config.transformType,
            inputs: JSON.stringify(inputs, null, 2),
            config: JSON.stringify(config, null, 2)
        });

        try {
            // Determinar qué datos usar para la transformación
            let inputData = inputs;

            // Si inputs es un objeto con una propiedad 'default', usamos eso
            if (inputs && typeof inputs === 'object' && inputs.default !== undefined) {
                inputData = inputs.default;
            }

            // Aplicar la transformación usando el procesador
            const transformedData = processTransformation(inputData, config);

            // Construir el resultado con metadata
            const result = {
                success: true,
                data: transformedData,
                transformType: config.transformType,
                metadata: {
                    inputType: Array.isArray(inputData) ? 'array' : typeof inputData,
                    outputType: Array.isArray(transformedData) ? 'array' : typeof transformedData,
                    transformApplied: config.transformType
                }
            };

            console.log('[Transformer] Resultado de la transformación:',
                JSON.stringify(transformedData, null, 2).substring(0, 500) +
                (JSON.stringify(transformedData, null, 2).length > 500 ? '...' : '')
            );

            return result;
        } catch (error) {
            console.error(`[Transformer] Error al aplicar transformación: ${error.message}`);
            return {
                success: false,
                error: error.message,
                data: inputs,
                metadata: { error: true }
            };
        }
    }

    // Método de mapeo de propiedades
    mapObjectProperties(obj, mapping) {
        if (!mapping || typeof mapping !== 'object' || !obj) {
            return obj;
        }

        const result = {};

        Object.entries(mapping).forEach(([targetKey, sourceConfig]) => {
            if (typeof sourceConfig === 'string') {
                // Mapeo directo: "newKey": "oldKey"
                result[targetKey] = this.getNestedValue(obj, sourceConfig);
            } else if (typeof sourceConfig === 'object') {
                // Mapeo con transformación
                const value = sourceConfig.field ?
                    this.getNestedValue(obj, sourceConfig.field) :
                    obj;

                if (sourceConfig.transform) {
                    switch (sourceConfig.transform) {
                        case 'toString':
                            result[targetKey] = value !== null && value !== undefined ? String(value) : null;
                            break;
                        case 'toNumber':
                            result[targetKey] = value !== null && value !== undefined ? Number(value) : null;
                            break;
                        case 'toCount':
                            result[targetKey] = Array.isArray(value) ? value.length : 0;
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
    }

    // Método de mapeo de propiedades
    mapObjectProperties(obj, mapping) {
        if (!mapping || typeof mapping !== 'object' || !obj) {
            return obj;
        }

        const result = {};

        Object.entries(mapping).forEach(([targetKey, sourceConfig]) => {
            if (typeof sourceConfig === 'string') {
                // Mapeo directo: "newKey": "oldKey"
                result[targetKey] = this.getNestedValue(obj, sourceConfig);
            } else if (typeof sourceConfig === 'object') {
                // Mapeo con transformación
                const value = sourceConfig.field ?
                    this.getNestedValue(obj, sourceConfig.field) :
                    obj;

                if (sourceConfig.transform) {
                    switch (sourceConfig.transform) {
                        case 'toString':
                            result[targetKey] = value !== null && value !== undefined ? String(value) : null;
                            break;
                        case 'toNumber':
                            result[targetKey] = value !== null && value !== undefined ? Number(value) : null;
                            break;
                        // Añadir más transformaciones según necesites
                        default:
                            result[targetKey] = value;
                    }
                } else {
                    result[targetKey] = value;
                }
            }
        });

        return result;
    }

    // Método mejorado para resolver inputs entre nodos
    resolveNodeInputs(node, edges, nodeResults) {
        const inputs = {};

        console.log(`🔍 Resolviendo inputs para nodo ${node.id} (${node.type})`);
        console.log('Conexiones entrantes:', edges);
        console.log('Resultados de nodos previos:', Object.keys(nodeResults));

        // Buscar conexiones que lleven a este nodo
        const incomingEdges = edges.filter(edge => edge.target === node.id);

        // Si no hay conexiones, intentar obtener datos del último nodo ejecutado
        if (incomingEdges.length === 0) {
            const lastNodeId = Object.keys(nodeResults).pop();
            if (lastNodeId) {
                const lastNodeResult = nodeResults[lastNodeId];

                // Extraer datos de diferentes estructuras de respuesta
                if (lastNodeResult.data) {
                    if (lastNodeResult.data.CustomResponse) {
                        inputs.default = lastNodeResult.data.CustomResponse;
                    } else if (Array.isArray(lastNodeResult.data)) {
                        inputs.default = lastNodeResult.data;
                    } else {
                        inputs.default = lastNodeResult.data;
                    }
                } else {
                    inputs.default = lastNodeResult;
                }
            }
        } else {
            // Procesar conexiones entrantes
            incomingEdges.forEach(edge => {
                const sourceResult = nodeResults[edge.source];

                if (sourceResult) {
                    let processedData = sourceResult;

                    // Extraer datos de diferentes tipos de respuestas
                    if (sourceResult.data) {
                        if (sourceResult.data.CustomResponse) {
                            processedData = sourceResult.data.CustomResponse;
                        } else if (Array.isArray(sourceResult.data)) {
                            processedData = sourceResult.data;
                        } else {
                            processedData = sourceResult.data;
                        }
                    }

                    // Asignar al handle correspondiente
                    const targetHandle = edge.targetHandle || 'default';
                    inputs[targetHandle] = processedData;
                }
            });
        }

        console.log(`📦 Inputs finales para nodo ${node.id}:`, inputs);
        return inputs;
    }

    // Método de apoyo para imprimir más información de depuración
    logWorkflowExecution(workflow) {
        console.log('=== Inicio de Workflow ===');
        console.log('Nodos:', workflow.nodes.map(n => `${n.id} (${n.type})`));
        console.log('Conexiones:', workflow.edges.map(e =>
            `${e.source} -> ${e.target} (${e.targetHandle || 'default'})`
        ));
    }
    /**
     * Aplicar transformación a los datos según configuración
     */
    applyTransformation(data, transformation) {
        if (!transformation || !transformation.type) return data;

        try {
            switch (transformation.type) {
                case 'filter':
                    return this.applyFilterTransformation(data, transformation.config);
                case 'map':
                    return this.applyMapTransformation(data, transformation.config);
                case 'reduce':
                    return this.applyReduceTransformation(data, transformation.config);
                case 'aggregate':
                    return this.applyAggregateTransformation(data, transformation.config);
                case 'pick':
                    return this.applyPickTransformation(data, transformation.config);
                case 'flatten':
                    return this.applyFlattenTransformation(data, transformation.config);
                default:
                    return data;
            }
        } catch (error) {
            console.error('Error applying transformation:', error);
            return data;
        }
    }

    /**
     * Transformación: Filtrar datos
     */
    applyFilterTransformation(data, config) {
        // Si data es una respuesta de API, intentamos extraer los datos reales
        if (data && data.data && !Array.isArray(data)) {
            data = data.data;
        }

        // Asegurarnos que tenemos un array
        if (!Array.isArray(data)) {
            if (Array.isArray(data.data)) {
                data = data.data;
            } else {
                return data;
            }
        }

        const { field, operator, value } = config;

        return data.filter(item => {
            const fieldValue = this.getNestedValue(item, field);

            switch (operator) {
                case 'equals':
                    return fieldValue == value;
                case 'notEquals':
                    return fieldValue != value;
                case 'contains':
                    return String(fieldValue).includes(String(value));
                case 'startsWith':
                    return String(fieldValue).startsWith(String(value));
                case 'endsWith':
                    return String(fieldValue).endsWith(String(value));
                case 'greaterThan':
                    return Number(fieldValue) > Number(value);
                case 'lessThan':
                    return Number(fieldValue) < Number(value);
                case 'greaterOrEqual':
                    return Number(fieldValue) >= Number(value);
                case 'lessOrEqual':
                    return Number(fieldValue) <= Number(value);
                case 'exists':
                    return fieldValue !== undefined && fieldValue !== null;
                case 'isEmpty':
                    return fieldValue === undefined || fieldValue === null || fieldValue === '';
                case 'between':
                    return Number(fieldValue) >= Number(config.min) &&
                        Number(fieldValue) <= Number(config.max);
                default:
                    return true;
            }
        });
    }

    /**
     * Transformación: Mapear propiedades
     */
    applyMapTransformation(data, config) {
        // Si data es una respuesta de API, intentamos extraer los datos reales
        if (data && data.data && !Array.isArray(data)) {
            data = data.data;
        }

        if (Array.isArray(data)) {
            // Para arrays, aplicamos el mapping a cada elemento
            return data.map(item => this.mapObjectProperties(item, config.mapping));
        } else if (typeof data === 'object' && data !== null) {
            // Si es un objeto, lo transformamos según el mapping
            return this.mapObjectProperties(data, config.mapping);
        }

        return data;
    }

    /**
     * Transformación: Reducir array a valor único
     */
    applyReduceTransformation(data, config) {
        // Asegurarse que tenemos un array
        if (!Array.isArray(data)) {
            if (data && Array.isArray(data.data)) {
                data = data.data;
            } else {
                return data;
            }
        }

        const { initialValue, operation, field } = config;
        let initValue = initialValue;

        // Establecer valores iniciales apropiados según operación
        if (initValue === undefined) {
            switch (operation) {
                case 'sum':
                case 'count':
                    initValue = 0;
                    break;
                case 'multiply':
                    initValue = 1;
                    break;
                case 'concat':
                    initValue = '';
                    break;
                case 'min':
                    initValue = Infinity;
                    break;
                case 'max':
                    initValue = -Infinity;
                    break;
                default:
                    initValue = null;
            }
        }

        return data.reduce((acc, item) => {
            const value = field ? this.getNestedValue(item, field) : item;

            switch (operation) {
                case 'sum':
                    return acc + (Number(value) || 0);
                case 'multiply':
                    return acc * (Number(value) || 1);
                case 'concat':
                    return String(acc) + String(value || '');
                case 'count':
                    return acc + 1;
                case 'countTrue':
                    return acc + (value ? 1 : 0);
                case 'min':
                    return Math.min(acc, Number(value) || Infinity);
                case 'max':
                    return Math.max(acc, Number(value) || -Infinity);
                case 'join':
                    const separator = config.separator || ',';
                    return acc ? acc + separator + String(value || '') : String(value || '');
                default:
                    return acc;
            }
        }, initValue);
    }

    /**
     * Transformación: Agrupar y agregar datos
     */
    applyAggregateTransformation(data, config) {
        // Asegurarse que tenemos un array
        if (!Array.isArray(data)) {
            if (data && Array.isArray(data.data)) {
                data = data.data;
            } else {
                return data;
            }
        }

        const { groupBy, aggregations } = config;

        // Agrupar datos
        const groups = {};

        data.forEach(item => {
            const groupValue = this.getNestedValue(item, groupBy);
            const key = String(groupValue !== undefined ? groupValue : 'null');

            if (!groups[key]) {
                groups[key] = [];
            }

            groups[key].push(item);
        });

        // Aplicar agregaciones a cada grupo
        return Object.entries(groups).map(([groupKey, items]) => {
            const result = { [groupBy.split('.').pop()]: groupKey === 'null' ? null : groupKey };

            aggregations.forEach(agg => {
                const { operation, field, resultField } = agg;

                switch (operation) {
                    case 'count':
                        result[resultField] = items.length;
                        break;
                    case 'sum':
                        result[resultField] = items.reduce(
                            (sum, item) => sum + (Number(this.getNestedValue(item, field)) || 0), 0
                        );
                        break;
                    case 'avg':
                        const total = items.reduce(
                            (sum, item) => sum + (Number(this.getNestedValue(item, field)) || 0), 0
                        );
                        result[resultField] = items.length ? total / items.length : 0;
                        break;
                    case 'min':
                        result[resultField] = items.reduce(
                            (min, item) => Math.min(min, Number(this.getNestedValue(item, field)) || Infinity),
                            Infinity
                        );
                        if (result[resultField] === Infinity) result[resultField] = null;
                        break;
                    case 'max':
                        result[resultField] = items.reduce(
                            (max, item) => Math.max(max, Number(this.getNestedValue(item, field)) || -Infinity),
                            -Infinity
                        );
                        if (result[resultField] === -Infinity) result[resultField] = null;
                        break;
                    case 'first':
                        result[resultField] = items.length ? this.getNestedValue(items[0], field) : null;
                        break;
                    case 'last':
                        result[resultField] = items.length ?
                            this.getNestedValue(items[items.length - 1], field) : null;
                        break;
                    case 'array':
                        result[resultField] = items.map(item => this.getNestedValue(item, field));
                        break;
                    case 'join':
                        const values = items.map(item => this.getNestedValue(item, field))
                            .filter(value => value !== undefined && value !== null);
                        result[resultField] = values.join(agg.separator || ',');
                        break;
                }
            });

            return result;
        });
    }

    /**
     * Transformación: Seleccionar propiedades específicas
     */
    applyPickTransformation(data, config) {
        const { fields } = config;

        if (!fields || !Array.isArray(fields) || fields.length === 0) {
            return data;
        }

        if (Array.isArray(data)) {
            return data.map(item => this.pickObjectProperties(item, fields));
        } else if (typeof data === 'object' && data !== null) {
            return this.pickObjectProperties(data, fields);
        }

        return data;
    }

    /**
     * Transformación: Aplanar arrays anidados
     */
    applyFlattenTransformation(data, config) {
        const { depth = 1 } = config;

        if (!Array.isArray(data)) {
            if (data && Array.isArray(data.data)) {
                data = data.data;
            } else {
                return data;
            }
        }

        // Implementar flatten con profundidad específica
        const flatten = (arr, currentDepth = 0) => {
            return arr.reduce((acc, val) => {
                if (Array.isArray(val) && currentDepth < depth) {
                    return acc.concat(flatten(val, currentDepth + 1));
                } else {
                    return acc.concat(val);
                }
            }, []);
        };

        return flatten(data);
    }

    /**
     * Mapear propiedades de un objeto según configuración
     */
    mapObjectProperties(obj, mapping) {
        if (!mapping || typeof mapping !== 'object' || !obj) {
            return obj;
        }

        const result = {};

        Object.entries(mapping).forEach(([targetKey, sourceConfig]) => {
            if (typeof sourceConfig === 'string') {
                // Mapping directo: "newName": "oldName"
                result[targetKey] = this.getNestedValue(obj, sourceConfig);
            } else if (typeof sourceConfig === 'object') {
                // Mapping con transformación
                const value = sourceConfig.field ?
                    this.getNestedValue(obj, sourceConfig.field) :
                    obj;

                if (sourceConfig.transform) {
                    switch (sourceConfig.transform) {
                        case 'toString':
                            result[targetKey] = value !== null && value !== undefined ? String(value) : null;
                            break;
                        case 'toNumber':
                            result[targetKey] = value !== null && value !== undefined ? Number(value) : null;
                            break;
                        case 'toBoolean':
                            result[targetKey] = Boolean(value);
                            break;
                        case 'toDate':
                            try {
                                result[targetKey] = value ? new Date(value).toISOString() : null;
                            } catch (e) {
                                result[targetKey] = null;
                            }
                            break;
                        case 'toTimestamp':
                            try {
                                result[targetKey] = value ? Math.floor(new Date(value).getTime() / 1000) : null;
                            } catch (e) {
                                result[targetKey] = null;
                            }
                            break;
                        case 'toLowerCase':
                            result[targetKey] = typeof value === 'string' ? value.toLowerCase() : String(value).toLowerCase();
                            break;
                        case 'toUpperCase':
                            result[targetKey] = typeof value === 'string' ? value.toUpperCase() : String(value).toUpperCase();
                            break;
                        case 'template':
                            result[targetKey] = this.processTemplate(sourceConfig.template, { value, ...obj });
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
    }

    /**
     * Seleccionar propiedades específicas de un objeto
     */
    pickObjectProperties(obj, fields) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        const result = {};

        fields.forEach(field => {
            const value = this.getNestedValue(obj, field);
            if (value !== undefined) {
                const parts = field.split('.');
                let current = result;

                parts.forEach((part, i) => {
                    if (i === parts.length - 1) {
                        current[part] = value;
                    } else {
                        current[part] = current[part] || {};
                        current = current[part];
                    }
                });
            }
        });

        return result;
    }

    /**
     * Obtener valor anidado de un objeto usando notación de punto
     */
    getNestedValue(obj, path) {
        if (!obj || !path) return undefined;

        // Para soportar notación de arrays como users[0].name
        const normalizedPath = path.replace(/\[(\w+)\]/g, '.$1');
        const keys = normalizedPath.split('.');
        let value = obj;

        for (const key of keys) {
            if (value === undefined || value === null) return undefined;
            value = value[key];
        }

        return value;
    }

    /**
     * Procesar plantillas en strings usando datos de entrada
     * Ejemplo: "Hola {{name}}" -> "Hola Juan" si inputs.name = "Juan"
     */
    processTemplate(template, inputs) {
        if (!template || typeof template !== 'string') return template;

        return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
            const value = this.getNestedValue(inputs, path.trim());
            return value !== undefined && value !== null ? String(value) : '';
        });
    }

    /**
     * Procesar plantillas en un objeto completo recursivamente
     */
    processObjectTemplates(obj, inputs) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.processObjectTemplates(item, inputs));
        }

        const result = {};

        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                result[key] = this.processTemplate(value, inputs);
            } else if (typeof value === 'object' && value !== null) {
                result[key] = this.processObjectTemplates(value, inputs);
            } else {
                result[key] = value;
            }
        }

        return result;
    }

    /**
     * Organizar nodos en orden de ejecución basado en dependencias
     */

    sortNodesByDependency(nodes, edges) {
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
                throw new Error(`Ciclo detectado en el workflow. Nodo implicado: ${nodeId}`);
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

        console.log("Orden de ejecución calculado:",
            result.map(node => `${node.id} (${node.type})`)
        );

        return result;
    }

    /**
     * Generar ID único para cada ejecución
     */
    generateExecutionId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }

    /**
     * Generar clave de caché para un nodo
     */
    generateNodeCacheKey(node, inputs) {
        const nodeConfig = JSON.stringify(node.data?.config || {});
        const inputHash = JSON.stringify(inputs);
        return `${node.id}_${node.type}_${nodeConfig.length}_${inputHash.length}`;
    }

    /**
     * Actualizar estado de un nodo durante ejecución
     */
    updateExecutionNodeStatus(executionId, nodeId, status) {
        const execution = this.activeExecutions.get(executionId);
        if (execution) {
            execution.nodeStatus[nodeId] = status;
        }
    }

    /**
     * Registrar eventos de ejecución
     */
    logExecution(executionId, node, message, error = null) {
        const execution = this.activeExecutions.get(executionId);
        if (execution) {
            execution.logs.push({
                timestamp: new Date().toISOString(),
                nodeId: node.id,
                nodeType: node.type,
                message,
                error
            });
        }
    }

    /**
     * Resumir resultado para evitar objetos demasiado grandes en eventos
     */
    summarizeResult(result) {
        if (!result) return null;

        if (Array.isArray(result)) {
            return {
                type: 'array',
                length: result.length,
                sample: result.slice(0, 2)
            };
        }

        if (typeof result === 'object') {
            const keys = Object.keys(result);
            return {
                type: 'object',
                keys,
                keyCount: keys.length
            };
        }

        return {
            type: typeof result,
            value: result
        };
    }

    /**
     * Resumir todos los resultados para mostrar en UI
     */
    summarizeResults(results) {
        return Object.entries(results).reduce((acc, [nodeId, result]) => {
            acc[nodeId] = this.summarizeResult(result);
            return acc;
        }, {});
    }

    /**
     * Registrar listener para eventos de ejecución
     */
    addEventListener(type, callback) {
        if (!this.eventListeners.has(type)) {
            this.eventListeners.set(type, new Set());
        }

        const listeners = this.eventListeners.get(type);
        listeners.add(callback);

        return () => {
            listeners.delete(callback);
        };
    }

    /**
     * Publicar evento a todos los listeners
     */
    publishEvent(event) {
        const { type } = event;

        // Notificar a listeners específicos del tipo
        const typeListeners = this.eventListeners.get(type);
        if (typeListeners) {
            typeListeners.forEach(callback => {
                try {
                    callback(event);
                } catch (error) {
                    console.error('Error in workflow event listener:', error);
                }
            });
        }

        // Notificar a listeners de todos los eventos
        const allListeners = this.eventListeners.get('*');
        if (allListeners) {
            allListeners.forEach(callback => {
                try {
                    callback(event);
                } catch (error) {
                    console.error('Error in workflow event listener:', error);
                }
            });
        }
    }

    /**
     * Obtener estado de una ejecución
     */
    getExecutionState(executionId) {
        return this.activeExecutions.get(executionId);
    }

    /**
     * Cancelar una ejecución en curso
     */
    cancelExecution(executionId) {
        const execution = this.activeExecutions.get(executionId);
        if (execution && execution.status === 'running') {
            execution.status = 'cancelled';
            execution.endTime = Date.now();

            this.publishEvent({
                type: 'workflow-cancelled',
                executionId,
                timestamp: new Date().toISOString()
            });

            return true;
        }

        return false;
    }
}