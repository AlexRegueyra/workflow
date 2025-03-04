// export default NodeConfigPanel;
import React, { useState } from 'react';
import { ChevronDown, Play } from 'lucide-react';
import JSONEditor from '../../utils/JSONEditor';

// Constantes para métodos y tipos de autenticación
const HTTP_METHODS = [
    'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'
];

const AUTH_TYPES = [
    'Ninguno', 'Básica', 'Bearer', 'API Key'
];

// Componente para mostrar respuesta de prueba
const ResponseViewer = ({ response, error }) => {
    if (error) {
        return (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm">
                <h4 className="font-medium text-red-600 mb-1">Error</h4>
                <p className="text-red-700">{error}</p>
            </div>
        );
    }

    if (!response) return null;

    return (
        <div className="mt-4 border rounded overflow-hidden">
            <div className="bg-gray-100 px-3 py-2 border-b">
                <div className="flex justify-between items-center">
                    <span className="font-medium">Respuesta</span>
                    <span className={`px-2 py-0.5 text-xs rounded ${response.status >= 200 && response.status < 300 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {response.status}
                    </span>
                </div>
            </div>
            <div className="p-3 bg-gray-50 max-h-60 overflow-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(response.data, null, 2)}
                </pre>
            </div>
        </div>
    );
};

const NodeConfigPanel = ({ node, onUpdate, onTestConnection }) => {
    // Extraer la configuración del nodo o usar valores predeterminados
    const [config, setConfig] = useState({
        url: node?.config?.url || '',
        method: node?.config?.method || 'GET',
        headers: node?.config?.headers || {},
        body: node?.config?.body || {},
        authentication: node?.config?.authentication || 'Ninguno',
        authConfig: node?.config?.authConfig || {}
    });

    // Estado para la vista previa de API
    const [isLoading, setIsLoading] = useState(false);
    const [apiResponse, setApiResponse] = useState(null);
    const [apiError, setApiError] = useState(null);

    // Formatear headers y body como strings para la edición
    const [headersText, setHeadersText] = useState(
        typeof config.headers === 'object'
            ? JSON.stringify(config.headers, null, 2)
            : config.headers || '{}'
    );

    const [bodyText, setBodyText] = useState(
        typeof config.body === 'object'
            ? JSON.stringify(config.body, null, 2)
            : config.body || '{}'
    );

    // Manejar cambio en los campos de configuración
    const handleConfigChange = (field, value) => {
        const updatedConfig = { ...config, [field]: value };
        setConfig(updatedConfig);

        // Actualizar el nodo
        onUpdate({
            ...node,
            config: {
                ...node.config,
                ...updatedConfig
            }
        });
    };

    // Manejar cambio en los campos de texto JSON
    const handleJsonChange = (field, text, setter) => {
        setter(text);

        try {
            // Intentar parsear como JSON
            const jsonValue = JSON.parse(text);
            handleConfigChange(field, jsonValue);
        } catch (error) {
            // Si no es JSON válido, guardar como texto
            handleConfigChange(field, text);
        }
    };

    // Manejar la prueba de API
    const handleTestApi = async () => {
        setIsLoading(true);
        setApiResponse(null);
        setApiError(null);

        try {
            // Crear un objeto con la configuración para la prueba
            const testConfig = {
                url: config.url,
                method: config.method,
                headers: typeof config.headers === 'string' ? JSON.parse(config.headers) : config.headers,
                body: typeof config.body === 'string' ? JSON.parse(config.body) : config.body,
                authentication: config.authentication,
                authConfig: config.authConfig
            };

            // Llamar a la función de prueba de conexión
            const result = await onTestConnection(testConfig);
            setApiResponse(result);
        } catch (error) {
            setApiError(error.message || 'Error al conectar con la API');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL del endpoint</label>
                <input
                    type="text"
                    value={config.url}
                    onChange={(e) => handleConfigChange('url', e.target.value)}
                    placeholder="https://api.ejemplo.com/endpoint"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
            </div>

            <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Método HTTP</label>
                <div className="relative">
                    <select
                        value={config.method}
                        onChange={(e) => handleConfigChange('method', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                    >
                        {HTTP_METHODS.map(method => (
                            <option key={method} value={method}>{method}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
            </div>

            <div className="form-group">

                <JSONEditor
                    label="Headers (JSON)"
                    value={config.headers}
                    onChange={(jsonValue) => handleConfigChange('headers', jsonValue)}
                    placeholder='{"Content-Type": "application/json"}'
                    height="min-h-[80px]"
                />
            </div>

            {['POST', 'PUT', 'PATCH'].includes(config.method) && (
                <div className="form-group">
                    <JSONEditor
                        label="Body (JSON)"
                        value={config.body}
                        onChange={(jsonValue) => handleConfigChange('body', jsonValue)}
                        placeholder='{"key": "value"}'
                        height="min-h-[100px]"
                    />
                </div>
            )}

            <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Autenticación</label>
                <div className="relative">
                    <select
                        value={config.authentication}
                        onChange={(e) => handleConfigChange('authentication', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                    >
                        {AUTH_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
            </div>

            {/* Campos específicos según el tipo de autenticación */}
            {config.authentication === 'Básica' && (
                <div className="space-y-4 mt-2 p-3 bg-gray-50 rounded-md">
                    <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                        <input
                            type="text"
                            value={config.authConfig?.username || ''}
                            onChange={(e) => handleConfigChange('authConfig', {
                                ...config.authConfig,
                                username: e.target.value
                            })}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <input
                            type="password"
                            value={config.authConfig?.password || ''}
                            onChange={(e) => handleConfigChange('authConfig', {
                                ...config.authConfig,
                                password: e.target.value
                            })}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>
            )}

            {config.authentication === 'Bearer' && (
                <div className="space-y-4 mt-2 p-3 bg-gray-50 rounded-md">
                    <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Token</label>
                        <input
                            type="text"
                            value={config.authConfig?.token || ''}
                            onChange={(e) => handleConfigChange('authConfig', {
                                ...config.authConfig,
                                token: e.target.value
                            })}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>
            )}

            {config.authentication === 'API Key' && (
                <div className="space-y-4 mt-2 p-3 bg-gray-50 rounded-md">
                    <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la clave</label>
                        <input
                            type="text"
                            value={config.authConfig?.keyName || ''}
                            onChange={(e) => handleConfigChange('authConfig', {
                                ...config.authConfig,
                                keyName: e.target.value
                            })}
                            placeholder="api_key"
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                        <input
                            type="text"
                            value={config.authConfig?.keyValue || ''}
                            onChange={(e) => handleConfigChange('authConfig', {
                                ...config.authConfig,
                                keyValue: e.target.value
                            })}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                        <div className="flex gap-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    checked={config.authConfig?.keyLocation === 'header'}
                                    onChange={() => handleConfigChange('authConfig', {
                                        ...config.authConfig,
                                        keyLocation: 'header'
                                    })}
                                    className="h-4 w-4 text-purple-600"
                                />
                                <span className="ml-2 text-sm text-gray-700">Header</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    checked={config.authConfig?.keyLocation === 'query'}
                                    onChange={() => handleConfigChange('authConfig', {
                                        ...config.authConfig,
                                        keyLocation: 'query'
                                    })}
                                    className="h-4 w-4 text-purple-600"
                                />
                                <span className="ml-2 text-sm text-gray-700">Query Param</span>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* Botón para probar la API */}
            <button
                onClick={handleTestApi}
                disabled={!config.url || isLoading}
                className={`w-full mt-2 px-4 py-2 flex items-center justify-center gap-2 rounded-md ${isLoading || !config.url ? 'bg-gray-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'} text-white transition-colors`}
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Probando...</span>
                    </>
                ) : (
                    <>
                        <Play size={16} />
                        <span>Probar API</span>
                    </>
                )}
            </button>

            {/* Mostrar respuesta de la prueba */}
            <ResponseViewer response={apiResponse} error={apiError} />
        </div>
    );
};

export default NodeConfigPanel;