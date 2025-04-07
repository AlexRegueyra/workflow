// Utilidad para acceder a propiedades anidadas usando notación de punto
const getNestedValue = (obj, path) => {
    if (!path) return obj;
    
    // Caso especial para el prefijo "data."
    if (path.startsWith('data.')) {
        // Si el path empieza con data, buscamos en diferentes estructuras posibles
        const actualPath = path.substring(5); // quitar "data."
        
        // 1. Buscar directamente en el objeto
        let value = getNestedByParts(obj, actualPath.split('.'));
        if (value !== undefined) return value;
        
        // 2. Buscar en obj.data si existe
        if (obj.data) {
            value = getNestedByParts(obj.data, actualPath.split('.'));
            if (value !== undefined) return value;
        }
        
        // 3. Buscar en obj.default si existe
        if (obj.default) {
            value = getNestedByParts(obj.default, actualPath.split('.'));
            if (value !== undefined) return value;
            
            // 4. Si default es un array, buscar en el primer elemento
            if (Array.isArray(obj.default) && obj.default.length > 0) {
                value = getNestedByParts(obj.default[0], actualPath.split('.'));
                if (value !== undefined) return value;
            }
            
            // 5. Buscar en default.CustomResponse[0] si existe
            if (obj.default.CustomResponse && Array.isArray(obj.default.CustomResponse) && 
                obj.default.CustomResponse.length > 0) {
                value = getNestedByParts(obj.default.CustomResponse[0], actualPath.split('.'));
                if (value !== undefined) return value;
            }
        }
        
        // 6. Buscar en obj.CustomResponse si existe
        if (obj.CustomResponse) {
            if (Array.isArray(obj.CustomResponse) && obj.CustomResponse.length > 0) {
                value = getNestedByParts(obj.CustomResponse[0], actualPath.split('.'));
                if (value !== undefined) return value;
            }
        }
        
        console.warn(`No se pudo encontrar el path: ${path} en los datos`);
        return undefined;
    }
    
    // Caso normal (sin prefijo "data.")
    return getNestedByParts(obj, path.split('.'));
};

// Función auxiliar para navegar por partes del path
const getNestedByParts = (obj, parts) => {
    let current = obj;
    
    for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        current = current[part];
    }
    
    return current;
};

// Utilidad para establecer propiedades anidadas usando notación de punto
const setNestedValue = (obj, path, value) => {
    if (!path) return obj;
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (current[part] === undefined) {
            current[part] = {};
        }
        current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
    return obj;
};

// Evaluador de expresiones simples
const evaluateExpression = (expression, data) => {
    if (!expression || typeof expression !== 'string') return expression;
    
    // Si la expresión es solo un camino de acceso
    if (!/[+\-*\/()&|<>=!]/.test(expression)) {
        return getNestedValue(data, expression);
    }
    
    try {
        // Caso especial: operaciones aritméticas con prefijo data
        if (expression.includes('data.') && /[+\-*\/]/.test(expression)) {
            // Extraer las partes de la expresión que contienen data.
            const parts = expression.match(/data\.\w+(?:\.\w+)*/g);
            
            if (parts) {
                let processedExpr = expression;
                
                // Reemplazar cada ocurrencia de data.campo con su valor real
                for (const part of parts) {
                    const value = getNestedValue(data, part);
                    if (value === undefined) return undefined; // Si alguna parte no existe, no podemos evaluar
                    
                    // Reemplazar la referencia con el valor real
                    processedExpr = processedExpr.replace(part, typeof value === 'string' ? `"${value}"` : value);
                }
                
                // Evaluar la expresión procesada
                return eval(processedExpr);
            }
        }
        
        // Caso general para otras expresiones
        const processedExpr = expression.replace(/(\w+(?:\.\w+)*)/g, (match) => {
            // Verificar si es un número o una referencia a datos
            if (/^\d+(\.\d+)?$/.test(match)) return match;
            const value = getNestedValue(data, match);
            if (value === undefined) return 'undefined';
            if (typeof value === 'string') return `"${value}"`;
            return value;
        });
        
        // Evaluar la expresión procesada
        return eval(processedExpr);
    } catch (error) {
        console.error(`Error evaluando expresión: ${expression}`, error);
        return undefined;
    }
};

// Función principal que aplica transformaciones
const processTransformation = (data, configObj) => {
    // Si los datos están vacíos, devolvemos un objeto vacío
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
        console.warn('Datos de entrada vacíos para el transformador');
        return data || {};
    }
    
    // Manejo de diferentes formatos de configuración
    let transformType, config;
    
    // Si configObj viene como string (lo que puede pasar según el log), intentamos parsearlo
    if (typeof configObj === 'string') {
        try {
            configObj = JSON.parse(configObj);
        } catch (e) {
            console.error('Error al parsear configuración del transformador:', e);
        }
    }
    
    // Extraer el tipo de transformación y la configuración de diferentes estructuras posibles
    if (configObj) {
        if (configObj.transformType) {
            // Formato esperado: { transformType: 'map', transformConfig: {...} }
            transformType = configObj.transformType;
            config = configObj.transformConfig || {};
        } else if (configObj.config && configObj.config.transformType) {
            // Formato alternativo: { config: { transformType: 'map', transformConfig: {...} } }
            transformType = configObj.config.transformType;
            config = configObj.config.transformConfig || {};
        } else if (configObj.transformConfig) {
            // Solo transformConfig sin tipo (asumimos 'map' como default)
            transformType = 'map';
            config = configObj.transformConfig;
        }
    }
    
    // Si no se pudo determinar el tipo, usar 'map' por defecto
    if (!transformType) {
        console.warn('Tipo de transformación no especificado, usando map por defecto');
        transformType = 'map';
    }
    
    // Si config no es un objeto, inicializarlo
    if (!config || typeof config !== 'object') {
        config = {};
    }
    
    console.log(`Aplicando transformación de tipo: ${transformType} con config:`, config);
    
    try {
        // Procesar los datos dependiendo del tipo de transformación
        let result;
        switch (transformType) {
            case 'filter':
                result = filterData(data, config);
                break;
            case 'map':
                result = mapData(data, config);
                break;
            case 'reduce':
                result = reduceData(data, config);
                break;
            case 'aggregate':
                result = aggregateData(data, config);
                break;
            case 'pick':
                result = pickFields(data, config);
                break;
            case 'flatten':
                result = flattenData(data, config);
                break;
            default:
                console.warn(`Tipo de transformación desconocido: ${transformType}, pasando datos sin transformar`);
                result = data;
        }
        
        // Verificar si tenemos resultado
        if (result === undefined || result === null) {
            console.warn('La transformación produjo un resultado nulo o indefinido');
            return {};
        }
        
        return result;
    } catch (error) {
        console.error(`Error procesando transformación ${transformType}:`, error);
        // Devolver un objeto que contenga información del error y los datos originales
        return { 
            error: error.message, 
            input: data,
            transformType,
            config
        };
    }
};

// Implementación de cada tipo de transformación
const filterData = (data, config) => {
    const { field, operator, value } = config;
    
    if (!field || !operator) return data;
    
    // Si los datos son un array, filtramos cada elemento
    if (Array.isArray(data)) {
        return data.filter(item => {
            const itemValue = getNestedValue(item, field);
            return compareValues(itemValue, value, operator);
        });
    } 
    // Si es un objeto individual, verificamos si cumple la condición
    else {
        const itemValue = getNestedValue(data, field);
        if (compareValues(itemValue, value, operator)) {
            return data;
        }
        return null;
    }
};

// Comparador para operaciones de filtrado
const compareValues = (a, b, operator) => {
    // Convertir a número si ambos valores parecen ser numéricos
    let aValue = a;
    let bValue = b;
    
    // Si parece ser un número, convertirlo
    if (!isNaN(Number(a))) {
        aValue = Number(a);
    }
    if (!isNaN(Number(b))) {
        bValue = Number(b);
    }
    
    // Ahora comparar los valores convertidos
    switch (operator) {
        case 'equals':
            return aValue == bValue;
        case 'notEquals':
            return aValue != bValue;
        case 'contains':
            return String(aValue).includes(String(bValue));
        case 'greaterThan':
            return aValue > bValue;
        case 'lessThan':
            return aValue < bValue;
        default:
            return false;
    }
};

// Transformación de mapeo
const mapData = (data, config) => {
    const { mapping } = config;
    
    if (!mapping || typeof mapping !== 'object') return data;
    
    // Manejar caso especial: el campo 'default' contiene los datos principales
    if (data && typeof data === 'object' && data.default) {
        console.log('Detectado patrón de datos con campo "default"');
        
        if (Array.isArray(data.default)) {
            // Si default es un array, mapeamos cada elemento
            const mappedDefault = data.default.map(item => mapSingleItem(item, mapping));
            return { ...data, default: mappedDefault };
        } else if (typeof data.default === 'object') {
            // Si default es un objeto, lo mapeamos
            const mappedDefault = mapSingleItem(data.default, mapping);
            return { ...data, default: mappedDefault };
        }
    }
    
    // Manejar caso especial: el campo 'data' contiene los datos principales
    if (data && typeof data === 'object' && data.data) {
        console.log('Detectado patrón de datos con campo "data"');
        
        if (Array.isArray(data.data)) {
            // Si data es un array, mapeamos cada elemento
            const mappedData = data.data.map(item => mapSingleItem(item, mapping));
            return { ...data, data: mappedData };
        } else if (typeof data.data === 'object') {
            // Si data es un objeto, lo mapeamos
            const mappedData = mapSingleItem(data.data, mapping);
            return { ...data, data: mappedData };
        }
    }
    
    // Manejo para el caso: respuesta API con CustomResponse
    if (data && typeof data === 'object' && data.data && data.data.CustomResponse) {
        console.log('Detectada respuesta API con CustomResponse');
        
        if (Array.isArray(data.data.CustomResponse)) {
            const mappedCustomResponse = data.data.CustomResponse.map(item => 
                mapSingleItem(item, mapping)
            );
            return {
                ...data,
                data: {
                    ...data.data,
                    CustomResponse: mappedCustomResponse
                }
            };
        }
    }
    
    // Caso general: manejar datos directamente
    if (Array.isArray(data)) {
        return data.map(item => mapSingleItem(item, mapping));
    } else {
        return mapSingleItem(data, mapping);
    }
};

// Mapea un solo elemento según la configuración
const mapSingleItem = (item, mapping) => {
    const result = {};
    
    // Manejar caso donde item puede ser undefined o null
    if (!item) {
        console.warn('Item nulo o indefinido en mapSingleItem');
        return result;
    }
    
    // Recorrer todas las propiedades del mapping
    for (const [newField, sourceExpr] of Object.entries(mapping)) {
        try {
            // Caso especial: expresiones aritméticas con data.
            if (typeof sourceExpr === 'string' && 
                sourceExpr.includes('data.') && 
                /[+\-*\/]/.test(sourceExpr)) {
                
                console.log(`Evaluando expresión aritmética: ${sourceExpr}`);
                
                // Extraer partes que contienen data.xxx
                const matches = sourceExpr.match(/data\.\w+(?:\.\w+)*/g) || [];
                
                if (matches.length > 0) {
                    // Obtener valores para cada parte
                    let calculable = true;
                    let processedExpr = sourceExpr;
                    
                    for (const match of matches) {
                        const value = getNestedValue(item, match);
                        console.log(`  Valor de ${match}:`, value);
                        
                        if (value === undefined) {
                            calculable = false;
                            console.warn(`  No se pudo obtener valor para ${match}`);
                            break;
                        }
                        
                        // Reemplazar en la expresión
                        processedExpr = processedExpr.replace(match, value);
                    }
                    
                    if (calculable) {
                        console.log(`  Expresión procesada: ${processedExpr}`);
                        try {
                            const calcResult = eval(processedExpr);
                            console.log(`  Resultado del cálculo: ${calcResult}`);
                            result[newField] = calcResult;
                            continue; // Pasar a la siguiente iteración
                        } catch (e) {
                            console.error(`  Error evaluando ${processedExpr}:`, e);
                        }
                    }
                }
            }
            
            // Detectar si sourceExpr tiene prefijo "data."
            if (typeof sourceExpr === 'string' && sourceExpr.startsWith('data.')) {
                // Extraer la ruta sin el prefijo "data."
                const path = sourceExpr.substring(5);
                
                // Buscar en el objeto item
                const value = getNestedValue(item, path);
                if (value !== undefined) {
                    result[newField] = value;
                } else {
                    // Si no se encuentra en item, buscar en item.data si existe
                    if (item.data) {
                        result[newField] = getNestedValue(item.data, path);
                    }
                }
            } else {
                // Evaluación normal para expresiones sin data.
                result[newField] = evaluateExpression(sourceExpr, item);
            }
        } catch (error) {
            console.error(`Error mapeando campo ${newField} con expresión ${sourceExpr}:`, error);
            result[newField] = null;
        }
    }
    
    return result;
};

// Transformación de reducción
const reduceData = (data, config) => {
    const { field, operation, initialValue } = config;
    
    if (!field || !operation) {
        console.warn('Reduce: Falta campo u operación en la configuración');
        return data;
    }
    
    console.log('Ejecutando reducción con:', { field, operation, initialValue });
    
    // Obtener el array a reducir, navegando por la estructura anidada
    let arrayToReduce = null;
    
    // Caso 1: data.default es un array
    if (data && data.default && Array.isArray(data.default)) {
        arrayToReduce = data.default;
    } 
    // Caso 2: data.default.CustomResponse es un array
    else if (data && data.default && data.default.CustomResponse && 
             Array.isArray(data.default.CustomResponse)) {
        arrayToReduce = data.default.CustomResponse;
    }
    // Caso 3: data es un array directamente
    else if (Array.isArray(data)) {
        arrayToReduce = data;
    }
    
    // Si no pudimos encontrar un array para reducir
    if (!arrayToReduce) {
        console.warn('Reduce: No se encontró un array para reducir', data);
        return data;
    }
    
    console.log(`Reduciendo array de ${arrayToReduce.length} elementos`);
    
    // Convertir initialValue al tipo adecuado según la operación
    let typedInitialValue;
    switch (operation) {
        case 'sum':
        case 'multiply':
        case 'min':
        case 'max':
            typedInitialValue = initialValue !== undefined ? Number(initialValue) : 
                (operation === 'sum' ? 0 : 
                 operation === 'multiply' ? 1 : 
                 operation === 'min' ? Infinity : 
                 operation === 'max' ? -Infinity : 0);
            break;
        case 'concat':
            typedInitialValue = initialValue !== undefined ? String(initialValue) : '';
            break;
        default:
            typedInitialValue = initialValue;
    }
    
    // Realizar la reducción
    try {
        const result = arrayToReduce.reduce((acc, item) => {
            let value;
            
            // Si field es una expresión aritmética con data.
            if (typeof field === 'string' && 
                field.includes('data.') && 
                /[+\-*\/]/.test(field)) {
                
                // Extraer partes que contienen data.xxx
                const matches = field.match(/data\.\w+(?:\.\w+)*/g) || [];
                
                if (matches.length > 0) {
                    // Obtener valores para cada parte
                    let calculable = true;
                    let processedExpr = field;
                    
                    for (const match of matches) {
                        const matchValue = getNestedValue(item, match);
                        
                        if (matchValue === undefined) {
                            calculable = false;
                            break;
                        }
                        
                        // Reemplazar en la expresión
                        processedExpr = processedExpr.replace(match, matchValue);
                    }
                    
                    if (calculable) {
                        try {
                            value = eval(processedExpr);
                        } catch (e) {
                            console.error(`Error evaluando ${processedExpr}:`, e);
                            value = 0;
                        }
                    } else {
                        value = 0;
                    }
                } else {
                    value = 0;
                }
            } else {
                // Obtener valor directo o usando getNestedValue
                value = typeof field === 'string' && field.startsWith('data.') 
                    ? getNestedValue(item, field)
                    : field;
            }
            
            // Asegurar que value es un número para operaciones numéricas
            if (['sum', 'multiply', 'min', 'max'].includes(operation)) {
                value = Number(value) || 0;
            }
            
            switch (operation) {
                case 'sum':
                    return acc + value;
                case 'multiply':
                    return acc * value;
                case 'concat':
                    return acc + String(value);
                case 'min':
                    return Math.min(acc, value);
                case 'max':
                    return Math.max(acc, value);
                default:
                    return acc;
            }
        }, typedInitialValue);
        
        console.log('Resultado de la reducción:', result);
        
        // Devolver el resultado manteniendo la estructura
        if (data && data.default && Array.isArray(data.default)) {
            return { ...data, reduceResult: result };
        } else if (data && data.default && data.default.CustomResponse) {
            return { 
                ...data, 
                default: { 
                    ...data.default,
                    reduceResult: result 
                } 
            };
        } else {
            return { reduceResult: result };
        }
    } catch (error) {
        console.error('Error en reducción:', error);
        return data;  // Devolver datos originales en caso de error
    }
};

// Transformación de agregación

const aggregateData = (data, config) => {
    const { field, method } = config;
    
    if (!method) {
        console.warn('Aggregate: Falta método en la configuración');
        return data;
    }
    
    console.log('Ejecutando agregación con:', { field, method });
    
    // Obtener el array a agregar, navegando por la estructura anidada
    let arrayToAggregate = null;
    
    // Caso 1: data.default es un array
    if (data && data.default && Array.isArray(data.default)) {
        arrayToAggregate = data.default;
    } 
    // Caso 2: data.default.default es un array (estructura anidada)
    else if (data && data.default && data.default.default && 
             Array.isArray(data.default.default)) {
        arrayToAggregate = data.default.default;
    }
    // Caso 3: data.default.CustomResponse es un array
    else if (data && data.default && data.default.CustomResponse && 
             Array.isArray(data.default.CustomResponse)) {
        arrayToAggregate = data.default.CustomResponse;
    }
    // Caso 4: data es un array directamente
    else if (Array.isArray(data)) {
        arrayToAggregate = data;
    }
    
    // Si no pudimos encontrar un array para agregar, usar el primer item que encontremos
    if (!arrayToAggregate && data && data.default && 
        Array.isArray(data.default) && data.default.length > 0) {
        // Intentar tratar un solo objeto como un array de un elemento
        arrayToAggregate = [data.default[0]];
        console.log('Usando un solo objeto como array para agregación');
    }
    
    // Si aún no tenemos un array, forzar la creación de uno
    if (!arrayToAggregate && data && typeof data === 'object') {
        // Último recurso: convertir el objeto en un array
        if (data.default) {
            arrayToAggregate = [data.default];
        } else {
            arrayToAggregate = [data];
        }
        console.log('Forzando objeto como array para agregación');
    }
    
    // Si definitivamente no hay nada para agregar
    if (!arrayToAggregate) {
        console.warn('Aggregate: No se encontró un array para agregar', data);
        return { 
            aggregateResult: { 
                error: "No se encontraron datos para agregar" 
            } 
        };
    }
    
    console.log(`Agregando array de ${arrayToAggregate.length} elementos`);
    
    // Realizar la agregación
    try {
        let result;
        
        switch (method) {
            case 'count':
                result = { count: arrayToAggregate.length };
                break;
                
            case 'sum':
                if (!field) {
                    result = { error: 'Se requiere un campo para sumar' };
                    break;
                }
                
                result = { 
                    sum: arrayToAggregate.reduce((acc, item) => {
                        // Manejar campo con prefijo data.
                        let value;
                        if (typeof field === 'string' && field.startsWith('data.')) {
                            value = getNestedValue(item, field);
                        } else {
                            value = getNestedValue(item, field);
                        }
                        
                        return acc + (Number(value) || 0);
                    }, 0) 
                };
                break;
                
            case 'average':
                if (!field) {
                    result = { error: 'Se requiere un campo para promediar' };
                    break;
                }
                
                const sum = arrayToAggregate.reduce((acc, item) => {
                    // Manejar campo con prefijo data.
                    let value;
                    if (typeof field === 'string' && field.startsWith('data.')) {
                        value = getNestedValue(item, field);
                    } else {
                        value = getNestedValue(item, field);
                    }
                    
                    return acc + (Number(value) || 0);
                }, 0);
                
                result = { average: arrayToAggregate.length ? sum / arrayToAggregate.length : 0 };
                break;
                
            case 'group':
                if (!field) {
                    result = { error: 'Se requiere un campo para agrupar' };
                    break;
                }
                
                const groups = {};
                
                for (const item of arrayToAggregate) {
                    // Manejar campo con prefijo data.
                    let groupValue;
                    if (typeof field === 'string' && field.startsWith('data.')) {
                        groupValue = getNestedValue(item, field);
                    } else {
                        groupValue = getNestedValue(item, field);
                    }
                    
                    const groupKey = String(groupValue || 'null');
                    if (!groups[groupKey]) {
                        groups[groupKey] = [];
                    }
                    groups[groupKey].push(item);
                }
                
                result = { groups };
                break;
                
            default:
                result = { error: `Método de agregación desconocido: ${method}` };
        }
        
        console.log('Resultado de la agregación:', result);
        
        // Devolver el resultado manteniendo la estructura
        return {
            ...data,
            aggregateResult: result
        };
    } catch (error) {
        console.error('Error en agregación:', error);
        return {
            ...data,
            aggregateResult: { error: error.message }
        };
    }
};

// Transformación para seleccionar campos específicos
const pickFields = (data, config) => {
    const { fields } = config;
    
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
        console.warn('Pick: No hay campos especificados para seleccionar o fields no es un array');
        
        // Si no hay campos, al menos mostrar un mensaje
        if (data && data.default) {
            return {
                ...data,
                pickInfo: "No se especificaron campos para seleccionar"
            };
        }
        return data;
    }
    
    console.log('Ejecutando pick con campos:', fields);
    
    // Manejar estructura específica con default y default anidados
    if (data && data.default) {
        // Si default.default es un array, procesar cada elemento
        if (data.default.default && Array.isArray(data.default.default)) {
            const pickedItems = data.default.default.map(item => pickFieldsFromItem(item, fields));
            return { 
                ...data, 
                default: { 
                    ...data.default,
                    default: pickedItems 
                } 
            };
        }
        
        // Si default es un array, procesar cada elemento
        if (Array.isArray(data.default)) {
            const pickedItems = data.default.map(item => pickFieldsFromItem(item, fields));
            return { ...data, default: pickedItems };
        }
        
        // Si default tiene CustomResponse como array, procesar cada elemento
        if (data.default.CustomResponse && Array.isArray(data.default.CustomResponse)) {
            const pickedItems = data.default.CustomResponse.map(item => pickFieldsFromItem(item, fields));
            return { 
                ...data, 
                default: { 
                    ...data.default, 
                    CustomResponse: pickedItems 
                } 
            };
        }
        
        // Si default es un objeto, procesar directamente
        return { ...data, default: pickFieldsFromItem(data.default, fields) };
    }
    
    // Si los datos son un array, seleccionamos campos para cada elemento
    if (Array.isArray(data)) {
        return data.map(item => pickFieldsFromItem(item, fields));
    } 
    
    // Si es un objeto individual, seleccionamos sus campos
    return pickFieldsFromItem(data, fields);
};

// Selecciona campos específicos de un elemento
const pickFieldsFromItem = (item, fields) => {
    const result = {};
    
    for (const field of fields) {
        const value = getNestedValue(item, field);
        if (value !== undefined) {
            // Mantener la estructura anidada en el resultado
            setNestedValue(result, field, value);
        }
    }
    
    return result;
};

// Transformación para aplanar estructuras anidadas
const flattenData = (data, config) => {
    const { depth = 1 } = config;
    
    console.log('Ejecutando flatten con profundidad:', depth);
    
    // Función auxiliar para verificar si el objeto tiene arrays anidados
    const hasNestedArrays = (obj) => {
        if (!obj || typeof obj !== 'object') return false;
        
        // Verificar propiedades directas
        for (const key in obj) {
            if (Array.isArray(obj[key])) {
                // Si alguna propiedad es un array, verificar si tiene elementos que son arrays
                if (obj[key].some(item => Array.isArray(item))) {
                    return true;
                }
            }
        }
        
        return false;
    };
    
    // Si no hay arrays anidados, crear un array de ejemplo para demostración
    if (!hasNestedArrays(data)) {
        console.log('No se encontraron arrays anidados para aplanar. Creando ejemplo...');
        
        // Crear un ejemplo con arrays anidados
        const exampleNestedArray = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, [9, 10]]
        ];
        
        // Aplanar el ejemplo y mostrarlo como resultado
        const flattenedExample = flattenArray(exampleNestedArray, depth);
        
        // Devolver los datos originales pero con un ejemplo de flatten
        return {
            ...data,
            flattenExample: {
                original: exampleNestedArray,
                flattened: flattenedExample,
                message: `Ejemplo de aplanamiento con profundidad ${depth}`
            }
        };
    }
    
    // Manejar estructuras anidadas comunes
    if (data && data.default) {
        // Si default es un array, aplanarlo
        if (Array.isArray(data.default)) {
            const flattened = flattenArray(data.default, depth);
            return { ...data, default: flattened };
        }
        
        // Si default.default es un array, aplanarlo
        if (data.default.default && Array.isArray(data.default.default)) {
            const flattened = flattenArray(data.default.default, depth);
            return { 
                ...data, 
                default: { 
                    ...data.default, 
                    default: flattened 
                } 
            };
        }
        
        // Si default tiene CustomResponse como array, aplanarlo
        if (data.default.CustomResponse && Array.isArray(data.default.CustomResponse)) {
            const flattened = flattenArray(data.default.CustomResponse, depth);
            return { 
                ...data, 
                default: { 
                    ...data.default, 
                    CustomResponse: flattened 
                } 
            };
        }
    }
    
    // Si los datos son un array, aplanamos sus elementos
    if (Array.isArray(data)) {
        return flattenArray(data, depth);
    } 
    
    // Si es un objeto, intentamos encontrar arrays para aplanar
    if (data && typeof data === 'object') {
        const result = { ...data };
        
        // Buscar arrays en el objeto y aplanarlos
        for (const key in result) {
            if (Array.isArray(result[key])) {
                result[key] = flattenArray(result[key], depth);
            }
        }
        
        return result;
    }
    
    // Si no es objeto ni array, devolver sin cambios
    return data;
};

// Aplanar un array según el nivel especificado
const flattenArray = (arr, depth) => {
    if (depth < 1) return arr;
    
    return arr.reduce((acc, val) => {
        if (Array.isArray(val)) {
            if (depth === 1) {
                return acc.concat(val);
            } else {
                return acc.concat(flattenArray(val, depth - 1));
            }
        } else {
            return acc.concat(val);
        }
    }, []);
};

// Exportar funciones para uso externo
export {
    processTransformation,
    getNestedValue,
    setNestedValue,
    evaluateExpression
};