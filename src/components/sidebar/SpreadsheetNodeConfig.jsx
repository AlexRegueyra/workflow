import React, { useState } from 'react';

const SpreadsheetNodeConfig = ({ node, onChange }) => {
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
                    Tipo de Servicio
                </label>
                <select
                    value={config.serviceType || ''}
                    onChange={(e) => handleChange('serviceType', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="">Seleccionar servicio...</option>
                    <option value="google">Google Sheets</option>
                    <option value="excel_online">Excel Online</option>
                    <option value="excel_file">Archivo Excel</option>
                    <option value="csv">CSV</option>
                </select>
            </div>

            {config.serviceType === 'google' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ID de Hoja de Cálculo
                        </label>
                        <input
                            type="text"
                            value={config.spreadsheetId || ''}
                            onChange={(e) => handleChange('spreadsheetId', e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Credenciales (JSON)
                        </label>
                        <textarea
                            value={typeof config.credentials === 'object' 
                                ? JSON.stringify(config.credentials, null, 2) 
                                : config.credentials || '{}'}
                            onChange={(e) => {
                                try {
                                    const jsonValue = JSON.parse(e.target.value);
                                    handleChange('credentials', jsonValue);
                                } catch (error) {
                                    handleChange('credentials', e.target.value);
                                }
                            }}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] font-mono text-sm"
                            placeholder='{"client_email": "example@project.iam.gserviceaccount.com", ...}'
                        />
                    </div>
                </>
            )}

            {config.serviceType === 'excel_online' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            URL de la Hoja
                        </label>
                        <input
                            type="text"
                            value={config.fileUrl || ''}
                            onChange={(e) => handleChange('fileUrl', e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="https://onedrive.live.com/edit.aspx?..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Token de Acceso
                        </label>
                        <input
                            type="password"
                            value={config.accessToken || ''}
                            onChange={(e) => handleChange('accessToken', e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Hoja
                </label>
                <input
                    type="text"
                    value={config.sheetName || ''}
                    onChange={(e) => handleChange('sheetName', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Hoja1"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operación
                </label>
                <select
                    value={config.operation || ''}
                    onChange={(e) => handleChange('operation', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="">Seleccionar operación...</option>
                    <option value="read">Leer datos</option>
                    <option value="append">Añadir filas</option>
                    <option value="update">Actualizar celdas</option>
                    <option value="clear">Borrar rango</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rango
                </label>
                <input
                    type="text"
                    value={config.range || ''}
                    onChange={(e) => handleChange('range', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="A1:D10"
                />
                <p className="mt-1 text-xs text-gray-500">
                    Puedes usar variables: {"{{rango}}"}
                </p>
            </div>

            {config.operation === 'append' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Datos a añadir (JSON)
                    </label>
                    <textarea
                        value={typeof config.appendData === 'object' 
                            ? JSON.stringify(config.appendData, null, 2) 
                            : config.appendData || '[]'}
                        onChange={(e) => {
                            try {
                                const jsonValue = JSON.parse(e.target.value);
                                handleChange('appendData', jsonValue);
                            } catch (error) {
                                handleChange('appendData', e.target.value);
                            }
                        }}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] font-mono text-sm"
                        placeholder='[["Valor 1", "Valor 2"], ["Valor 3", "Valor 4"]]'
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Puedes usar variables para construir los datos dinámicamente
                    </p>
                </div>
            )}

            {config.operation === 'update' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valores a actualizar (JSON)
                    </label>
                    <textarea
                        value={typeof config.updateValues === 'object' 
                            ? JSON.stringify(config.updateValues, null, 2) 
                            : config.updateValues || '{}'}
                        onChange={(e) => {
                            try {
                                const jsonValue = JSON.parse(e.target.value);
                                handleChange('updateValues', jsonValue);
                            } catch (error) {
                                handleChange('updateValues', e.target.value);
                            }
                        }}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] font-mono text-sm"
                        placeholder='{"A1": "Nuevo valor", "B2": "Otro valor"}'
                    />
                </div>
            )}
        </div>
    );
};

export default SpreadsheetNodeConfig;