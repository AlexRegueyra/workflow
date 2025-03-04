import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const DatabaseNode = ({ nodeId, inputs, config, onExecute }) => {
    useEffect(() => {
        console.log(`[Database] Ejecutando nodo de base de datos ${nodeId}`);
        console.log('[DEBUG] Datos recibidos:', JSON.stringify(inputs, null, 2).substring(0, 500) + '...');
        console.log('[DEBUG] Configuración:', JSON.stringify(config, null, 2));

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

        try {
            // Extraer la configuración de la base de datos
            const { type, host, port, username, password, database, query } = config;

            // Validar que se ha proporcionado la configuración básica
            if (!type || !host || !port || !database) {
                throw new Error('Configuración incompleta. Verifica los datos de conexión.');
            }

            // En un entorno real, aquí conectaríamos a la base de datos
            // Por ahora, simulamos la operación
            simulateDatabaseOperation(inputs, config)
                .then(result => {
                    console.log('[Database] Operación completada con éxito:', result);

                    onExecute?.(nodeId, {
                        success: true,
                        data: result,
                        metadata: {
                            dbType: type,
                            operation: 'query',
                            rowsAffected: result.rowsAffected || result.data?.length || 0
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
        } catch (error) {
            console.error('[Database] Error en el nodo:', error);

            onExecute?.(nodeId, {
                success: false,
                error: error.message,
                data: {},
                metadata: { error: true }
            });
        }
    }, [nodeId, inputs, config, onExecute]);

    // Este componente no renderiza nada visible
    return null;
};

// Simulación de operación en base de datos (reemplazar por implementación real)
const simulateDatabaseOperation = async (inputs, config) => {
    return new Promise((resolve, reject) => {
        // Simulamos un tiempo de respuesta de la base de datos
        setTimeout(() => {
            try {
                const { type, query } = config;

                // Procesamos la consulta para reemplazar variables
                let processedQuery = query;

                // Si hay una consulta, intentamos procesarla
                if (query) {
                    // Extraer variables de la consulta
                    const variableMatches = query.match(/{{([^}]+)}}/g) || [];

                    // Reemplazar variables con valores de los inputs
                    variableMatches.forEach(match => {
                        const variableName = match.replace(/{{|}}/g, '');
                        let variableValue = '';

                        // Intentar obtener el valor de la variable de los inputs
                        if (inputs.default) {
                            if (Array.isArray(inputs.default)) {
                                // Si es un array, tomamos el primer elemento
                                const firstItem = inputs.default[0];
                                variableValue = firstItem[variableName] ||
                                    (firstItem.data && firstItem.data[variableName]) ||
                                    '';
                            } else {
                                // Si es un objeto
                                variableValue = inputs.default[variableName] ||
                                    (inputs.default.data && inputs.default.data[variableName]) ||
                                    '';
                            }
                        } else {
                            // Si no hay inputs.default, intentamos con el input directo
                            variableValue = inputs[variableName] || '';
                        }

                        // Reemplazar en la consulta
                        processedQuery = processedQuery.replace(match, variableValue);
                    });
                }

                console.log(`[Database] Ejecutando consulta: ${processedQuery}`);

                // Simulamos diferentes tipos de respuestas según el tipo de DB
                let result;

                if (processedQuery.toLowerCase().includes('select')) {
                    // Simulamos una consulta SELECT
                    result = {
                        success: true,
                        operation: 'select',
                        data: [
                            { id: 1, name: 'Ejemplo 1', value: 100 },
                            { id: 2, name: 'Ejemplo 2', value: 200 },
                            { id: 3, name: 'Ejemplo 3', value: 300 }
                        ],
                        rowsAffected: 3,
                        message: 'Consulta ejecutada correctamente'
                    };
                } else if (processedQuery.toLowerCase().includes('insert')) {
                    // Simulamos una operación INSERT
                    result = {
                        success: true,
                        operation: 'insert',
                        insertId: 123,
                        rowsAffected: 1,
                        message: 'Registro insertado correctamente'
                    };
                } else if (processedQuery.toLowerCase().includes('update')) {
                    // Simulamos una operación UPDATE
                    result = {
                        success: true,
                        operation: 'update',
                        rowsAffected: 5,
                        message: 'Registros actualizados correctamente'
                    };
                } else if (processedQuery.toLowerCase().includes('delete')) {
                    // Simulamos una operación DELETE
                    result = {
                        success: true,
                        operation: 'delete',
                        rowsAffected: 2,
                        message: 'Registros eliminados correctamente'
                    };
                } else {
                    // Operación desconocida
                    result = {
                        success: true,
                        operation: 'unknown',
                        message: 'Operación completada',
                        query: processedQuery
                    };
                }

                resolve(result);
            } catch (error) {
                reject(new Error(`Error al procesar la consulta: ${error.message}`));
            }
        }, 500); // Simulamos 500ms de tiempo de respuesta
    });
};

DatabaseNode.propTypes = {
    nodeId: PropTypes.string.isRequired,
    inputs: PropTypes.any,
    config: PropTypes.object,
    onExecute: PropTypes.func
};

export default DatabaseNode;