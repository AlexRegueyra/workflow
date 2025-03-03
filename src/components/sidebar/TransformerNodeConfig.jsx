import React from 'react';
import PropTypes from 'prop-types';

const TransformerNodeConfig = ({ node, onChange }) => {
    // Asegurar que tenemos la estructura correcta con valores por defecto
    const config = node.config || {};
    const transformConfig = config.transformConfig || {};
    const transformType = config.transformType || 'map';

    // Función para actualizar la configuración del nodo
    const handleConfigChange = (updates) => {
        onChange({
            ...node,
            config: {
                ...config,
                ...updates
            }
        });
    };

    // Renderizar campos específicos según el tipo de transformación
    const renderTransformConfigFields = () => {
        switch (transformType) {
            case 'filter':
                return (
                    <>
                        <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Campo</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={transformConfig.field || ''}
                                onChange={(e) => handleConfigChange({
                                    transformConfig: {
                                        ...transformConfig,
                                        field: e.target.value
                                    }
                                })}
                                placeholder="Ej: data.status"
                            />
                        </div>

                        <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Operador</label>
                            <select
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={transformConfig.operator || 'equals'}
                                onChange={(e) => handleConfigChange({
                                    transformConfig: {
                                        ...transformConfig,
                                        operator: e.target.value
                                    }
                                })}
                            >
                                <option value="equals">Igual a</option>
                                <option value="notEquals">Diferente a</option>
                                <option value="contains">Contiene</option>
                                <option value="greaterThan">Mayor que</option>
                                <option value="lessThan">Menor que</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={transformConfig.value || ''}
                                onChange={(e) => handleConfigChange({
                                    transformConfig: {
                                        ...transformConfig,
                                        value: e.target.value
                                    }
                                })}
                                placeholder="Valor para filtrar"
                            />
                        </div>
                    </>
                );

            case 'map':
                return (
                    <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Configuración de mapeo (JSON)
                        </label>
                        <textarea
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                            value={JSON.stringify(transformConfig.mapping || {}, null, 2)}
                            onChange={(e) => {
                                try {
                                    const mapping = JSON.parse(e.target.value);
                                    handleConfigChange({
                                        transformConfig: {
                                            ...transformConfig,
                                            mapping
                                        }
                                    });
                                } catch (error) {
                                    // Manejar error de parsing
                                    console.error('Error parsing JSON', error);
                                }
                            }}
                            placeholder='{"nuevoNombre": "campoOriginal"}'
                            rows={5}
                        />
                    </div>
                );

            case 'reduce':
                return (
                    <>
                        <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Campo</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={transformConfig.field || ''}
                                onChange={(e) => handleConfigChange({
                                    transformConfig: {
                                        ...transformConfig,
                                        field: e.target.value
                                    }
                                })}
                                placeholder="Campo a reducir"
                            />
                        </div>

                        <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Operación</label>
                            <select
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={transformConfig.operation || 'sum'}
                                onChange={(e) => handleConfigChange({
                                    transformConfig: {
                                        ...transformConfig,
                                        operation: e.target.value
                                    }
                                })}
                            >
                                <option value="sum">Suma</option>
                                <option value="multiply">Multiplicación</option>
                                <option value="concat">Concatenación</option>
                                <option value="min">Mínimo</option>
                                <option value="max">Máximo</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Valor inicial</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={transformConfig.initialValue || ''}
                                onChange={(e) => handleConfigChange({
                                    transformConfig: {
                                        ...transformConfig,
                                        initialValue: e.target.value
                                    }
                                })}
                                placeholder="Valor inicial para reducción"
                            />
                        </div>
                    </>
                );

            case 'aggregate':
                return (
                    <>
                        <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Campo de agregación</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={transformConfig.field || ''}
                                onChange={(e) => handleConfigChange({
                                    transformConfig: {
                                        ...transformConfig,
                                        field: e.target.value
                                    }
                                })}
                                placeholder="Campo para agregar"
                            />
                        </div>

                        <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Método de agregación</label>
                            <select
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={transformConfig.method || 'count'}
                                onChange={(e) => handleConfigChange({
                                    transformConfig: {
                                        ...transformConfig,
                                        method: e.target.value
                                    }
                                })}
                            >
                                <option value="count">Contar</option>
                                <option value="sum">Sumar</option>
                                <option value="average">Promedio</option>
                                <option value="group">Agrupar</option>
                            </select>
                        </div>
                    </>
                );

            case 'pick':
                return (
                    <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Campos a seleccionar</label>
                        <textarea
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                            value={JSON.stringify(transformConfig.fields || [], null, 2)}
                            onChange={(e) => {
                                try {
                                    const fields = JSON.parse(e.target.value);
                                    handleConfigChange({
                                        transformConfig: {
                                            ...transformConfig,
                                            fields
                                        }
                                    });
                                } catch (error) {
                                    console.error('Error parsing JSON', error);
                                }
                            }}
                            placeholder='["campo1", "campo2"]'
                            rows={5}
                        />
                    </div>
                );

            case 'flatten':
                return (
                    <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de aplanamiento</label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            value={transformConfig.depth || 1}
                            onChange={(e) => handleConfigChange({
                                transformConfig: {
                                    ...transformConfig,
                                    depth: parseInt(e.target.value, 10)
                                }
                            })}
                            placeholder="Nivel de aplanamiento (default: 1)"
                            min="1"
                        />
                    </div>
                );

            default:
                return (
                    <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Configuración JSON</label>
                        <textarea
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                            value={JSON.stringify(transformConfig, null, 2)}
                            onChange={(e) => {
                                try {
                                    const configObj = JSON.parse(e.target.value);
                                    handleConfigChange({ transformConfig: configObj });
                                } catch (error) {
                                    console.error('Error parsing JSON', error);
                                }
                            }}
                            rows={5}
                        />
                    </div>
                );
        }
    };

    return (
        <div className="space-y-4">
            <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de transformación</label>
                <select
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={transformType}
                    onChange={(e) => handleConfigChange({ 
                        transformType: e.target.value,
                        // Resetear la configuración cuando cambia el tipo de transformación
                        transformConfig: {} 
                    })}
                >
                    <option value="filter">Filtrar</option>
                    <option value="map">Mapear</option>
                    <option value="reduce">Reducir</option>
                    <option value="aggregate">Agregar</option>
                    <option value="pick">Seleccionar</option>
                    <option value="flatten">Aplanar</option>
                </select>
            </div>

            {renderTransformConfigFields()}
        </div>
    );
};

// Definir PropTypes para validación de tipos
TransformerNodeConfig.propTypes = {
    node: PropTypes.shape({
        config: PropTypes.shape({
            transformType: PropTypes.string,
            transformConfig: PropTypes.object
        })
    }).isRequired,
    onChange: PropTypes.func.isRequired
};

export default TransformerNodeConfig;