import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, HelpCircle } from 'lucide-react';

const ConditionalNodeConfig = ({ node, onChange }) => {
    // Asegurar que tenemos la estructura correcta
    const config = node.config || {};
    const [fieldError, setFieldError] = useState('');
    const [commonPaths, setCommonPaths] = useState([
        'CustomResponse.username',
        'CustomResponse.status',
        'data.message',
        'data.status',
        'status'
    ]);
    
    // Campo de prueba para mostrar ejemplos
    const [testValue, setTestValue] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    // Función para actualizar configuración
    const handleChange = (field, value) => {
        onChange({
            ...node,
            config: {
                ...config,
                [field]: value
            }
        });
        
        // Limpiar errores al cambiar campos
        if (field === 'field') {
            setFieldError('');
        }
    };
    
    // Validar el campo ingresado
    const validateField = (fieldPath) => {
        if (!fieldPath) {
            setFieldError('El campo es obligatorio');
            return false;
        }
        
        // Verificar si cumple con el formato esperado
        if (!/^[a-zA-Z0-9_\[\].]+$/.test(fieldPath)) {
            setFieldError('El campo contiene caracteres no válidos');
            return false;
        }
        
        setFieldError('');
        return true;
    };

    // Operadores disponibles con descripciones detalladas
    const OPERATORS = [
        { 
            value: 'equals', 
            label: 'Igual a', 
            description: 'Comprueba si el valor es exactamente igual al especificado',
            examples: ['texto', '123', 'true']
        },
        { 
            value: 'notEquals', 
            label: 'Diferente a', 
            description: 'Comprueba si el valor es diferente al especificado',
            examples: ['texto', '123', 'true'] 
        },
        { 
            value: 'contains', 
            label: 'Contiene', 
            description: 'Verifica si un texto contiene la cadena especificada o si un array contiene el valor',
            examples: ['abc', 'user']
        },
        { 
            value: 'greaterThan', 
            label: 'Mayor que', 
            description: 'Compara si el valor numérico es mayor que el especificado',
            examples: ['5', '100', '1000']
        },
        { 
            value: 'lessThan', 
            label: 'Menor que', 
            description: 'Compara si el valor numérico es menor que el especificado',
            examples: ['5', '100', '1000']
        },
        { 
            value: 'exists', 
            label: 'Existe', 
            description: 'Verifica si el campo existe y no es nulo o vacío',
            examples: []
        },
        { 
            value: 'startsWith', 
            label: 'Comienza con', 
            description: 'Verifica si el texto comienza con la cadena especificada',
            examples: ['api', 'user', 'http']
        },
        { 
            value: 'endsWith', 
            label: 'Termina con', 
            description: 'Verifica si el texto termina con la cadena especificada',
            examples: ['.com', '.json', 'Name']
        }
    ];
    
    // Obtener ejemplos para el operador seleccionado
    const getExamplesForOperator = () => {
        const selectedOperator = OPERATORS.find(op => op.value === config.operator);
        return selectedOperator ? selectedOperator.examples : [];
    };

    return (
        <div className="space-y-4">
            <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campo a evaluar <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={config.field || ''}
                        onChange={(e) => handleChange('field', e.target.value)}
                        onBlur={() => validateField(config.field)}
                        placeholder="Ejemplo: CustomResponse.username"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            fieldError ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {commonPaths.length > 0 && (
                        <div className="absolute right-2 top-2">
                            <div className="dropdown relative">
                                <button 
                                    type="button"
                                    className="text-gray-400 hover:text-gray-700"
                                    onClick={() => setShowPreview(!showPreview)}
                                >
                                    <HelpCircle size={18} />
                                </button>
                                {showPreview && (
                                    <div className="dropdown-menu absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                                        <div className="p-2 text-xs font-medium text-gray-700 border-b">
                                            Rutas comunes:
                                        </div>
                                        <div className="max-h-48 overflow-y-auto">
                                            {commonPaths.map((path, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                                    onClick={() => {
                                                        handleChange('field', path);
                                                        setShowPreview(false);
                                                    }}
                                                >
                                                    {path}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                {fieldError && (
                    <p className="mt-1 text-xs text-red-500 flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        {fieldError}
                    </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                    Usa notación de punto para propiedades anidadas.
                    <br />
                    Ejemplo: <code className="bg-gray-100 px-1 rounded">CustomResponse.username</code>, <code className="bg-gray-100 px-1 rounded">data.status</code>
                </p>
            </div>

            <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operador de comparación <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {OPERATORS.map((op) => (
                        <button
                            key={op.value}
                            type="button"
                            onClick={() => handleChange('operator', op.value)}
                            className={`
                                px-3 py-2 text-sm rounded-md transition-all flex items-center justify-center
                                ${config.operator === op.value 
                                    ? 'bg-purple-600 text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                            `}
                        >
                            {op.label}
                        </button>
                    ))}
                </div>
                {config.operator && (
                    <p className="mt-2 text-xs text-gray-600 flex items-start">
                        <Info size={14} className="mr-1 mt-0.5 flex-shrink-0" />
                        <span>{OPERATORS.find(op => op.value === config.operator)?.description}</span>
                    </p>
                )}
            </div>

            {config.operator !== 'exists' && (
                <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor a comparar {config.operator !== 'exists' && <span className="text-red-500">*</span>}
                    </label>
                    <input
                        type="text"
                        value={config.value || ''}
                        onChange={(e) => handleChange('value', e.target.value)}
                        placeholder="Valor de comparación"
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    
                    {/* Sugerencias de valores comunes */}
                    {getExamplesForOperator().length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {getExamplesForOperator().map((example, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleChange('value', example)}
                                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                >
                                    {example}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="my-4 border-t border-gray-200 pt-4">
                <div className="p-3 bg-blue-50 rounded-md flex items-start">
                    <div className="mr-3 mt-0.5">
                        <CheckCircle className="text-green-500" size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-blue-800 mb-1">
                            Comportamiento del Nodo Condicional
                        </h4>
                        <p className="text-xs text-blue-700">
                            Este nodo evalúa una condición y dirige el flujo a través de dos caminos posibles:
                        </p>
                        <ul className="mt-1 text-xs text-blue-700 list-disc list-inside">
                            <li>
                                <span className="font-semibold text-green-600">Verdadero</span>: 
                                Si la condición se cumple.
                            </li>
                            <li>
                                <span className="font-semibold text-red-600">Falso</span>: 
                                Si la condición no se cumple.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Vista previa de configuración */}
            {(config.field && config.operator) && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center">
                        <Info size={16} className="mr-1" />
                        Configuración actual
                    </h4>
                    <div className="bg-white p-3 rounded border text-sm">
                        <p>
                            Si <span className="font-mono bg-gray-100 px-1 rounded">{config.field}</span>{' '}
                            {OPERATORS.find(op => op.value === config.operator)?.label.toLowerCase()}{' '}
                            {config.operator !== 'exists' ? 
                                <span className="font-mono bg-gray-100 px-1 rounded">{config.value || '?'}</span> 
                                : ''
                            }
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConditionalNodeConfig;