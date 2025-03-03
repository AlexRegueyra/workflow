import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { processTransformation } from './transformerProcessor';

const TransformerNode = ({ nodeId, inputs, config, onExecute }) => {
    // Procesar la transformación cuando los inputs o la configuración cambian
    useEffect(() => {
        console.log(`[Transformer] Aplicando transformación de tipo ${config?.transformType}`);
        console.log('[DEBUG] Ejecutando transformador', {
            transformType: config?.transformType,
            inputs: JSON.stringify(inputs),
            config: JSON.stringify(config, null, 2)
        });

        // Si no hay inputs o configuración, no hacemos nada
        if (!inputs || !config) {
            console.warn('Transformer: No hay inputs o configuración');
            onExecute?.(nodeId, { success: true, data: {}, metadata: { inputType: 'undefined', outputType: 'object' } });
            return;
        }

        try {
            // Determinar qué datos usar como entrada
            let inputData = inputs;
            
            // Si inputs es un objeto con una propiedad 'default', usamos eso
            if (inputs && typeof inputs === 'object' && inputs.default !== undefined) {
                inputData = inputs.default;
            }
            
            // Aplicar la transformación
            const transformedData = processTransformation(inputData, config);
            
            // Construir resultado con metadata
            const result = {
                success: true,
                data: transformedData,
                metadata: {
                    inputType: Array.isArray(inputData) ? 'array' : typeof inputData,
                    outputType: Array.isArray(transformedData) ? 'array' : typeof transformedData
                }
            };
            
            // Notificar al sistema sobre la ejecución completada
            onExecute?.(nodeId, result);
        } catch (error) {
            console.error('Error en el nodo transformador:', error);
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

TransformerNode.propTypes = {
    nodeId: PropTypes.string.isRequired,
    inputs: PropTypes.any,
    config: PropTypes.object,
    onExecute: PropTypes.func
};

export default TransformerNode;