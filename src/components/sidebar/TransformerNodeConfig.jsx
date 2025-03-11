import React from 'react';
import PropTypes from 'prop-types';
import JSONEditor from '../../utils/JSONEditor'; // Importamos el componente JSONEditor

const TransformerNodeConfig = ({ node, onChange, previousNodeData }) => {
    // Asegurar que tenemos la estructura correcta con valores por defecto
    const config = node.config || {};
    const transformConfig = config.transformConfig || {};
    const transformType = config.transformType || 'map';

    // Generar configuraciones por defecto según el tipo de transformación
    const getDefaultConfig = (type) => {
        switch (type) {
            case 'filter':
                return {
                    field: '',
                    operator: 'equals',
                    value: ''
                };
            case 'map':
                return {
                    mapping: {}
                };
            case 'reduce':
                return {
                    field: '',
                    operation: 'sum', // Valor por defecto para evitar errores
                    initialValue: '0'
                };
            case 'aggregate':
                return {
                    field: '',
                    method: 'count' // Valor por defecto para evitar errores
                };
            case 'pick':
                return {
                    fields: [] // Array vacío por defecto, no un objeto
                };
            case 'flatten':
                return {
                    depth: 1
                };
            case 'excel':
                return {
                    operation: 'select_columns',
                    columns: [],
                    filterCondition: '',
                    sortBy: '',
                    sortDirection: 'asc',
                    limit: 10
                };

            default:
                return {};
        }
    };

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

    // Obtener una vista previa de los datos previos
    const renderPreviousDataPreview = () => {
        if (!previousNodeData) return null;

        let previewData = previousNodeData;
        // Si hay muchos datos, mostrar solo una muestra
        if (Array.isArray(previousNodeData) && previousNodeData.length > 3) {
            previewData = previousNodeData.slice(0, 3);
            previewData.push({ _note: `... y ${previousNodeData.length - 3} elementos más` });
        }

        return (
            <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Datos recibidos del nodo anterior:</h3>
                <pre className="text-xs overflow-auto max-h-40 p-2 bg-gray-100 rounded">
                    {JSON.stringify(previewData, null, 2)}
                </pre>
            </div>
        );
    };

    // Renderizar campos específicos según el tipo de transformación
    const renderTransformConfigFields = () => {
        switch (transformType) {
            case 'filter':
                return (
                    <>
                        {renderPreviousDataPreview()}

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
                    <>
                        {renderPreviousDataPreview()}

                        <div className="form-group">
                            <JSONEditor
                                label="Configuración de mapeo (JSON)"
                                value={transformConfig.mapping || {}}
                                onChange={(mapping) => handleConfigChange({
                                    transformConfig: {
                                        ...transformConfig,
                                        mapping
                                    }
                                })}
                                placeholder='{"nuevoNombre": "campoOriginal"}'
                                height="min-h-[120px]"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Ejemplo: {"{'nuevoNombre': 'data.campoOriginal', 'total': 'data.precio * data.cantidad'}"}
                            </p>
                        </div>
                    </>
                );

            case 'reduce':
                return (
                    <>
                        {renderPreviousDataPreview()}

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
                                placeholder="Campo a reducir (ej: data.cantidad)"
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
                        {renderPreviousDataPreview()}

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
                                placeholder="Campo para agregar (ej: data.username)"
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
                    <>
                        {renderPreviousDataPreview()}

                        <div className="form-group">
                            <JSONEditor
                                label="Campos a seleccionar (Array)"
                                value={transformConfig.fields || []}
                                onChange={(fields) => {
                                    // Asegurar que fields es un array y no está vacío
                                    const validFields = Array.isArray(fields) ? fields : [];

                                    // Si el array está vacío, añadir un campo de ejemplo
                                    if (validFields.length === 0) {
                                        validFields.push("data.monto");
                                    }

                                    handleConfigChange({
                                        transformConfig: {
                                            ...transformConfig,
                                            fields: validFields
                                        }
                                    });
                                }}
                                placeholder='["campo1", "campo2"]'
                                height="min-h-[120px]"
                            />
                            {(transformConfig.fields || []).length === 0 && (
                                <p className="mt-1 text-xs text-red-500">
                                    ⚠️ Debes especificar al menos un campo para seleccionar
                                </p>
                            )}
                        </div>
                    </>
                );

            case 'flatten':
                return (
                    <>
                        {renderPreviousDataPreview()}

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
                    </>
                );
      
            case 'excel':
                return (
                    <>
                        {renderPreviousDataPreview()}

                        <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Operación</label>
                            <select
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={transformConfig.operation || 'select_columns'}
                                onChange={(e) => handleConfigChange({
                                    transformConfig: {
                                        ...transformConfig,
                                        operation: e.target.value
                                    }
                                })}
                            >
                                <option value="select_columns">Seleccionar columnas</option>
                                <option value="filter_rows">Filtrar filas</option>
                                <option value="sort">Ordenar</option>
                                <option value="limit">Limitar resultados</option>
                            </select>
                        </div>

                        {/* Controles específicos según la operación */}
                        {transformConfig.operation === 'select_columns' && (
                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Columnas (separadas por coma)</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={Array.isArray(transformConfig.columns) ? transformConfig.columns.join(',') : ''}
                                    onChange={(e) => {
                                        const columns = e.target.value.split(',').map(c => c.trim()).filter(c => c);
                                        handleConfigChange({
                                            transformConfig: {
                                                ...transformConfig,
                                                columns
                                            }
                                        });
                                    }}
                                    placeholder="Ej: Nombre completo, Email, Teléfono"
                                />
                            </div>
                        )}

                        {transformConfig.operation === 'filter_rows' && (
                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Condición de filtro</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={transformConfig.filterCondition || ''}
                                    onChange={(e) => handleConfigChange({
                                        transformConfig: {
                                            ...transformConfig,
                                            filterCondition: e.target.value
                                        }
                                    })}
                                    placeholder='row["Grupo de clientes"] === "A"'
                                />
                            </div>
                        )}

                        {transformConfig.operation === 'sort' && (
                            <>
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Campo para ordenar</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-md"
                                        value={transformConfig.sortBy || ''}
                                        onChange={(e) => handleConfigChange({
                                            transformConfig: {
                                                ...transformConfig,
                                                sortBy: e.target.value
                                            }
                                        })}
                                        placeholder="Ej: Nombre completo"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-md"
                                        value={transformConfig.sortDirection || 'asc'}
                                        onChange={(e) => handleConfigChange({
                                            transformConfig: {
                                                ...transformConfig,
                                                sortDirection: e.target.value
                                            }
                                        })}
                                    >
                                        <option value="asc">Ascendente</option>
                                        <option value="desc">Descendente</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {transformConfig.operation === 'limit' && (
                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número de filas</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={transformConfig.limit || 10}
                                    onChange={(e) => handleConfigChange({
                                        transformConfig: {
                                            ...transformConfig,
                                            limit: parseInt(e.target.value, 10)
                                        }
                                    })}
                                    min="1"
                                    placeholder="10"
                                />
                            </div>
                        )}
                    </>
                );
            default:
                return (
                    <>
                        {renderPreviousDataPreview()}

                        <div className="form-group">
                            <JSONEditor
                                label="Configuración JSON"
                                value={transformConfig}
                                onChange={(configObj) => handleConfigChange({ transformConfig: configObj })}
                                height="min-h-[150px]"
                            />
                        </div>
                    </>
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
                    onChange={(e) => {
                        const newType = e.target.value;
                        // Obtener configuración por defecto para el nuevo tipo
                        const defaultConfig = getDefaultConfig(newType);

                        // Actualizar con el nuevo tipo y la configuración por defecto
                        handleConfigChange({
                            transformType: newType,
                            transformConfig: defaultConfig
                        });
                    }}
                >
                    <option value="filter">Filtrar</option>
                    <option value="map">Mapear</option>
                    <option value="reduce">Reducir</option>
                    <option value="aggregate">Agregar</option>
                    <option value="pick">Seleccionar</option>
                    <option value="flatten">Aplanar</option>
                    <option value="excel">Excel</option>
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
    onChange: PropTypes.func.isRequired,
    previousNodeData: PropTypes.any // Datos del nodo anterior
};

export default TransformerNodeConfig;