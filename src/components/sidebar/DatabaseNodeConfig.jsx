import React, { useState } from 'react';

const DatabaseNodeConfig = ({ node, onChange }) => {
    const config = node.config || {};
    const [testingConnection, setTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const handleChange = (field, value) => {
        const updatedNode = {
            ...node,
            config: {
                ...node.config,
                [field]: value
            }
        };
        onChange(updatedNode);
    };
    const handleTestConnection = async () => {
        setTestingConnection(true);
        setTestResult(null);

        try {
            // Validar datos mínimos
            if (!config.type || !config.host || !config.port || !config.database) {
                throw new Error('Por favor completa los datos de conexión básicos');
            }

            // Simular la conexión (en un entorno real, esto sería una llamada API)
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Simular éxito o error aleatorio para demostración
            const success = Math.random() > 0.3; // 70% de probabilidad de éxito

            if (success) {
                setTestResult({
                    success: true,
                    message: `Conexión exitosa a ${config.type} en ${config.host}:${config.port}/${config.database}`
                });
            } else {
                throw new Error(`No se pudo conectar a la base de datos: error de autenticación`);
            }
        } catch (error) {
            setTestResult({
                success: false,
                message: error.message
            });
        } finally {
            setTestingConnection(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Base de Datos
                </label>
                <select
                    value={config.type || ''}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="">Seleccionar tipo...</option>
                    <option value="mysql">MySQL</option>
                    <option value="postgres">PostgreSQL</option>
                    <option value="mongodb">MongoDB</option>
                    {/* <option value="sqlserver">SQL Server</option>
                    <option value="oracle">Oracle</option> */}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Host / Servidor
                </label>
                <input
                    type="text"
                    value={config.host || ''}
                    onChange={(e) => handleChange('host', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="localhost"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Puerto
                </label>
                <input
                    type="number"
                    value={config.port || ''}
                    onChange={(e) => handleChange('port', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="3306"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usuario
                </label>
                <input
                    type="text"
                    value={config.user || ''}
                    onChange={(e) => handleChange('user', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="root"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña
                </label>
                <input
                    type="password"
                    value={config.password || ''}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base de Datos
                </label>
                <input
                    type="text"
                    value={config.database || ''}
                    onChange={(e) => handleChange('database', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="mydb"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consulta SQL
                </label>
                <textarea
                    value={config.query || ''}
                    onChange={(e) => handleChange('query', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] font-mono text-sm"
                    placeholder="SELECT * FROM users WHERE id = {{id}}"
                />
                <p className="mt-1 text-xs text-gray-500">
                    Puedes usar variables entre dobles llaves: {"{{variable}}"}
                </p>
            </div>

            <button
                className="w-full mt-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                onClick={handleTestConnection}
                disabled={testingConnection}
            >
                {testingConnection ? 'Probando...' : 'Probar Conexión'}
            </button>

            {/* Mostrar resultado de la prueba */}
            {testResult && (
                <div className={`mt-2 p-2 rounded-md ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <p className="text-sm">{testResult.message}</p>
                </div>
            )}
        </div>
    );
};

export default DatabaseNodeConfig;