import React, { useState } from 'react';

const DatabaseNodeConfig = ({ node, onChange }) => {
    const config = node.config || {};

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
                    <option value="sqlserver">SQL Server</option>
                    <option value="oracle">Oracle</option>
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
                    type="text"
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
                    value={config.username || ''}
                    onChange={(e) => handleChange('username', e.target.value)}
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
                onClick={() => {
                    // Simulación de prueba de conexión
                    alert(`Probando conexión a ${config.type} en ${config.host}:${config.port}`);
                }}
            >
                Probar Conexión
            </button>
        </div>
    );
};

export default DatabaseNodeConfig;