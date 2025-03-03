import React, { useState } from 'react';

const EmailNodeConfig = ({ node, onChange }) => {
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
                    Servidor SMTP
                </label>
                <input
                    type="text"
                    value={config.smtpServer || ''}
                    onChange={(e) => handleChange('smtpServer', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="smtp.gmail.com"
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
                    placeholder="587"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seguridad
                </label>
                <select
                    value={config.security || ''}
                    onChange={(e) => handleChange('security', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="">Seleccionar...</option>
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="none">Ninguna</option>
                </select>
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
                    placeholder="usuario@gmail.com"
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
                    Remitente
                </label>
                <input
                    type="text"
                    value={config.from || ''}
                    onChange={(e) => handleChange('from', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Mi Empresa <info@miempresa.com>"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destinatario(s)
                </label>
                <input
                    type="text"
                    value={config.to || ''}
                    onChange={(e) => handleChange('to', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="usuario@ejemplo.com, otro@ejemplo.com"
                />
                <p className="mt-1 text-xs text-gray-500">
                    Puedes usar variables: {"{{email}}"}
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asunto
                </label>
                <input
                    type="text"
                    value={config.subject || ''}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Asunto del correo"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contenido del Correo
                </label>
                <select
                    value={config.contentType || 'text'}
                    onChange={(e) => handleChange('contentType', e.target.value)}
                    className="w-full mb-2 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="text">Texto plano</option>
                    <option value="html">HTML</option>
                </select>
                <textarea
                    value={config.body || ''}
                    onChange={(e) => handleChange('body', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[150px]"
                    placeholder={config.contentType === 'html' ? 
                        "<h1>Hola {{nombre}}</h1><p>Mensaje de prueba</p>" :
                        "Hola {{nombre}},\n\nEste es un mensaje de prueba.\n\nSaludos,\nMi Empresa"}
                />
                <p className="mt-1 text-xs text-gray-500">
                    Puedes usar variables entre dobles llaves: {"{{variable}}"}
                </p>
            </div>
        </div>
    );
};

export default EmailNodeConfig;