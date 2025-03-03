import React, { useState } from 'react';

const ChatbotNodeConfig = ({ node, onChange }) => {
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
                    Plataforma
                </label>
                <select
                    value={config.platform || ''}
                    onChange={(e) => handleChange('platform', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="">Seleccionar plataforma...</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telegram">Telegram</option>
                    <option value="facebook">Facebook Messenger</option>
                    <option value="web">Chat en Web</option>
                    <option value="sms">SMS</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token de API
                </label>
                <input
                    type="password"
                    value={config.apiToken || ''}
                    onChange={(e) => handleChange('apiToken', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Token de acceso"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID de Cuenta/Número
                </label>
                <input
                    type="text"
                    value={config.accountId || ''}
                    onChange={(e) => handleChange('accountId', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="ID de cuenta o número de teléfono"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destinatario
                </label>
                <input
                    type="text"
                    value={config.recipient || ''}
                    onChange={(e) => handleChange('recipient', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Número o ID del destinatario"
                />
                <p className="mt-1 text-xs text-gray-500">
                    Puedes usar variables: {"{{telefono}}"}
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Mensaje
                </label>
                <select
                    value={config.messageType || 'text'}
                    onChange={(e) => handleChange('messageType', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="text">Texto</option>
                    <option value="template">Plantilla</option>
                    <option value="interactive">Interactivo</option>
                    <option value="media">Multimedia</option>
                </select>
            </div>

            {config.messageType === 'template' ? (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre de Plantilla
                        </label>
                        <input
                            type="text"
                            value={config.templateName || ''}
                            onChange={(e) => handleChange('templateName', e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Nombre de la plantilla"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Variables de Plantilla (JSON)
                        </label>
                        <textarea
                            value={typeof config.templateVariables === 'object' 
                                ? JSON.stringify(config.templateVariables, null, 2) 
                                : config.templateVariables || '{}'}
                            onChange={(e) => {
                                try {
                                    const jsonValue = JSON.parse(e.target.value);
                                    handleChange('templateVariables', jsonValue);
                                } catch (error) {
                                    handleChange('templateVariables', e.target.value);
                                }
                            }}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] font-mono text-sm"
                            placeholder='{"nombre": "Juan", "servicio": "Premium"}'
                        />
                    </div>
                </>
            ) : (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mensaje
                    </label>
                    <textarea
                        value={config.message || ''}
                        onChange={(e) => handleChange('message', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
                        placeholder={`Hola, gracias por contactarnos.\nEn qué podemos ayudarte?`}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Puedes usar variables entre dobles llaves: {"{{variable}}"}
                    </p>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Respuesta esperada
                </label>
                <select
                    value={config.responseType || 'none'}
                    onChange={(e) => handleChange('responseType', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="none">Sin respuesta esperada</option>
                    <option value="text">Respuesta de texto</option>
                    <option value="button">Selección de botón</option>
                    <option value="quick_reply">Respuesta rápida</option>
                </select>
            </div>
        </div>
    );
};

export default ChatbotNodeConfig;