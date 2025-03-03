import React from 'react';

const WebhookNodeConfig = ({ node, onChange }) => {
    // Asegurar que tenemos la estructura correcta
    const config = node.config || {};

    // Función para actualizar configuración
    const handleChange = (field, value) => {
        onChange({
            ...node,
            config: {
                ...config,
                [field]: value
            }
        });
    };

    return (
        <div className="space-y-4">
            <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL del webhook:</label>
                <input
                    type="text"
                    value={config.url || ''}
                    onChange={(e) => handleChange('url', e.target.value)}
                    placeholder="https://ejemplo.com/webhook"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
            </div>

            <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Método:</label>
                <select
                    value={config.method || 'POST'}
                    onChange={(e) => handleChange('method', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                </select>
            </div>

            <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Headers (JSON):</label>
                <textarea
                    value={typeof config.headers === 'object'
                        ? JSON.stringify(config.headers, null, 2)
                        : config.headers || '{}'}
                    onChange={(e) => {
                        try {
                            const headers = JSON.parse(e.target.value);
                            handleChange('headers', headers);
                        } catch (error) {
                            // Si no es JSON válido, mantener como texto
                            handleChange('headers', e.target.value);
                        }
                    }}
                    placeholder='{"Content-Type": "application/json"}'
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                />
            </div>

            <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Payload (JSON):</label>
                <textarea
                    value={typeof config.payload === 'object'
                        ? JSON.stringify(config.payload, null, 2)
                        : config.payload || '{}'}
                    onChange={(e) => {
                        try {
                            const payload = JSON.parse(e.target.value);
                            handleChange('payload', payload);
                        } catch (error) {
                            // Si no es JSON válido, mantener como texto
                            handleChange('payload', e.target.value);
                        }
                    }}
                    placeholder='{"key": "value"}'
                    rows={5}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                />
            </div>
        </div>
    );
};

export default WebhookNodeConfig;