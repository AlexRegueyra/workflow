// DatabaseNode.jsx - Nodo para operaciones de base de datos
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import dbApiService from '../services/dbApiService'; // Ajusta la ruta según la estructura de tu proyecto

const DatabaseNode = ({ nodeId, inputs, config, onExecute }) => {
    useEffect(() => {
        console.log(`[Database] Ejecutando nodo de base de datos ${nodeId}`);
        console.log('[DEBUG] Datos recibidos:', JSON.stringify(inputs, null, 2).substring(0, 500) + '...');
        
        // Crear copia segura de configuración (sin mostrar contraseña)
        const safeConfig = { ...config };
        if (safeConfig.password) {
            safeConfig.password = '********';
        }
        console.log('[DEBUG] Configuración:', JSON.stringify(safeConfig, null, 2));

        // Si no hay inputs o configuración, no hacemos nada
        if (!inputs || !config) {
            console.warn('Database: No hay inputs o configuración');
            onExecute?.(nodeId, {
                success: false,
                error: 'No hay datos o configuración disponible',
                data: {}
            });
            return;
        }

        executeRealDatabaseOperation(inputs, config)
            .then(result => {
                console.log('[Database] Operación completada con éxito:', result);
                onExecute?.(nodeId, {
                    success: true,
                    data: result.data,
                    message: result.message || 'Operación completada',
                    metadata: {
                        dbType: config.type,
                        operation: result.operation,
                        rowsAffected: result.rowsAffected || 0
                    }
                });
            })
            .catch(error => {
                console.error('[Database] Error en operación:', error);
                onExecute?.(nodeId, {
                    success: false,
                    error: error.message,
                    data: {},
                    metadata: { error: true }
                });
            });
    }, [nodeId, inputs, config, onExecute]);

    // Este componente no renderiza nada visible
    return null;
};

// Implementación de operación en base de datos usando el servicio API
const executeRealDatabaseOperation = async (inputs, config) => {
    try {
        // Validar configuración mínima
        if (!config.type || !config.host || !config.database) {
            throw new Error('Configuración incompleta. Se requiere tipo, host y base de datos.');
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
        
        // Usar el servicio API para ejecutar la consulta
        return await dbApiService.executeQuery(config, processedQuery);
    } catch (error) {
        console.error(`[Database] Error al ejecutar operación:`, error);
        throw new Error(`Error en operación de base de datos: ${error.message}`);
    }
};

DatabaseNode.propTypes = {
    nodeId: PropTypes.string.isRequired,
    inputs: PropTypes.any,
    config: PropTypes.object,
    onExecute: PropTypes.func
};

export default DatabaseNode;