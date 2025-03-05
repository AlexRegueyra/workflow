import axios from 'axios';
// Ya no necesitamos importar googleapis aquí
// import { google } from 'googleapis'; <- ELIMINAR ESTA LÍNEA

// Función auxiliar para ejecutar operaciones
async function executeSpreadsheetNode(node, inputs, options = {}) {
    const config = node.data?.config || {};
    const serverUrl = 'http://localhost:3001';

    try {
        switch (config.serviceType) {
            case 'google':
                return await executeGoogleSheetsOperation(config, serverUrl);
            case 'excel_online':
                return await executeExcelOnlineOperation(config, serverUrl);
            case 'excel_file':
                return await executeExcelFileOperation(config, serverUrl);
            case 'csv':
                return await executeCSVOperation(config, serverUrl);
            default:
                throw new Error('Tipo de servicio no soportado');
        }
    } catch (error) {
        console.error('Error executing spreadsheet operation:', error);
        return {
            success: false,
            message: `Error: ${error.message}`,
            error: error
        };
    }
}

// Funciones auxiliares modificadas para usar el servidor
async function executeGoogleSheetsOperation(config, serverUrl) {
    try {
        const response = await axios.post(`${serverUrl}/api/spreadsheet/google-sheets`, config);
        return response.data;
    } catch (error) {
        console.error('Error en Google Sheets:', error);
        return {
            success: false,
            message: error.response?.data?.message || error.message
        };
    }
}

async function executeExcelOnlineOperation(config, serverUrl) {
    try {
        const response = await axios.post(`${serverUrl}/api/spreadsheet/excel-online`, config);
        return response.data;
    } catch (error) {
        console.error('Error en Excel Online:', error);
        return {
            success: false,
            message: error.response?.data?.message || error.message
        };
    }
}

async function executeExcelFileOperation(config, serverUrl) {
    try {
        const response = await axios.post(`${serverUrl}/api/spreadsheet/excel-file`, config);
        return response.data;
    } catch (error) {
        console.error('Error en Excel File:', error);
        return {
            success: false,
            message: error.response?.data?.message || error.message
        };
    }
}

async function executeCSVOperation(config, serverUrl) {
    try {
        const response = await axios.post(`${serverUrl}/api/spreadsheet/csv`, config);
        return response.data;
    } catch (error) {
        console.error('Error en CSV:', error);
        return {
            success: false,
            message: error.response?.data?.message || error.message
        };
    }
}

// Componente de React para configurar nodos de hoja de cálculo
const SpreadsheetNodeConfig = ({ node, onChange }) => {
    const config = node.data?.config || {};

    // Manejar cambios en la configuración
    const handleConfigChange = (key, value) => {
        const newConfig = { ...config, [key]: value };
        onChange({ ...node.data, config: newConfig });
    };

    // Maneja cambio de operación
    const handleOperationChange = (e) => {
        handleConfigChange('operation', e.target.value);
    };

    // Para actualizar un archivo JSON (credenciales)
    const handleFileUpload = (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target.result;
                handleConfigChange(field, content);
            } catch (error) {
                console.error("Error al leer el archivo:", error);
                alert("Error al leer el archivo. Asegúrate de que es un archivo válido.");
            }
        };
        reader.readAsText(file);
    };

    // Renderizar campos para Google Sheets
    const renderGoogleSheetsFields = () => (
        <div>
            <div className="mb-3">
                <label className="block text-sm font-medium mb-1">ID de hoja de cálculo</label>
                <input
                    type="text"
                    className="w-full p-2 border rounded"
                    placeholder="Ej: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    value={config.spreadsheetId || ''}
                    onChange={(e) => handleConfigChange('spreadsheetId', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">El ID se encuentra en la URL después de /d/ y antes de /edit</p>
            </div>

            <div className="mb-3 bg-yellow-50 p-2 border border-yellow-200 rounded">
                <p className="text-sm text-amber-700 font-medium">⚠️ Se requieren credenciales</p>
                <p className="text-xs text-amber-600 mt-1">
                    Google Sheets requiere autenticación para acceder a sus datos.
                    Por favor, sube un archivo de credenciales JSON de Google Cloud.
                </p>
            </div>

            <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Archivo de credenciales JSON</label>
                <input
                    type="file"
                    accept=".json"
                    className="w-full p-2 border rounded"
                    onChange={(e) => handleFileUpload(e, 'credentials')}
                />
                <p className="text-xs text-gray-500 mt-1">Sube tu archivo de credenciales de Google Cloud</p>
            </div>

            <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Operación</label>
                <select
                    className="w-full p-2 border rounded"
                    value={config.operation || ''}
                    onChange={handleOperationChange}
                >
                    <option value="">Seleccionar</option>
                    <option value="read">Leer datos</option>
                    <option value="append">Añadir datos</option>
                    <option value="update">Actualizar datos</option>
                    <option value="clear">Borrar datos</option>
                  
                </select>
            </div>

            <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Nombre de la hoja o rango</label>
                <input
                    type="text"
                    className="w-full p-2 border rounded"
                    placeholder="Ej: Hoja1 o Hoja1!A1:D10"
                    value={config.range || ''}
                    onChange={(e) => handleConfigChange('range', e.target.value)}
                />
            </div>
            {config.serviceType === 'mock' && (
    <div className="mb-3 bg-green-50 p-2 border border-green-200 rounded">
        <p className="text-sm text-green-700 font-medium">✓ Datos de prueba</p>
        <p className="text-xs text-green-600 mt-1">
            Se usarán datos de prueba predefinidos. No se requiere configuración adicional.
        </p>
    </div>
)}
            {config.operation === 'append' && (
                <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Datos a añadir (como JSON)</label>
                    <textarea
                        className="w-full p-2 border rounded"
                        rows="4"
                        placeholder='Ej: [["Juan", "Pérez", 30], ["Ana", "García", 25]]'
                        value={JSON.stringify(config.appendData || [])}
                        onChange={(e) => {
                            try {
                                const data = JSON.parse(e.target.value);
                                handleConfigChange('appendData', data);
                            } catch (error) {
                                // Mantén el valor como texto si no es JSON válido
                                console.error("JSON no válido", error);
                            }
                        }}
                    />
                </div>
            )}

            {config.operation === 'update' && (
                <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Datos a actualizar (como JSON)</label>
                    <textarea
                        className="w-full p-2 border rounded"
                        rows="4"
                        placeholder='Ej: [["Nuevo valor 1", "Nuevo valor 2"], ["Nuevo valor 3", "Nuevo valor 4"]]'
                        value={JSON.stringify(config.updateValues || [])}
                        onChange={(e) => {
                            try {
                                const data = JSON.parse(e.target.value);
                                handleConfigChange('updateValues', data);
                            } catch (error) {
                                console.error("JSON no válido", error);
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );

    // Renderizar campos para Excel Online
    const renderExcelOnlineFields = () => (
        <div>
            <div className="mb-3">
                <label className="block text-sm font-medium mb-1">URL del archivo</label>
                <input
                    type="text"
                    className="w-full p-2 border rounded"
                    placeholder="https://ejemplo.com/archivo.xlsx"
                    value={config.fileUrl || ''}
                    onChange={(e) => handleConfigChange('fileUrl', e.target.value)}
                />
            </div>

            <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Token de acceso</label>
                <input
                    type="password"
                    className="w-full p-2 border rounded"
                    value={config.accessToken || ''}
                    onChange={(e) => handleConfigChange('accessToken', e.target.value)}
                />
            </div>

            <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Nombre de la hoja</label>
                <input
                    type="text"
                    className="w-full p-2 border rounded"
                    placeholder="Hoja1"
                    value={config.sheetName || ''}
                    onChange={(e) => handleConfigChange('sheetName', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Deja en blanco para usar la primera hoja</p>
            </div>
        </div>
    );

    // Renderizar campos para Excel File
    const renderExcelFileFields = () => (
        <div>
            <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Ruta del archivo</label>
                <input
                    type="text"
                    className="w-full p-2 border rounded"
                    placeholder="/ruta/al/archivo.xlsx"
                    value={config.filePath || ''}
                    onChange={(e) => handleConfigChange('filePath', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Ruta del archivo en el servidor</p>
            </div>

            <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Nombre de la hoja</label>
                <input
                    type="text"
                    className="w-full p-2 border rounded"
                    placeholder="Hoja1"
                    value={config.sheetName || ''}
                    onChange={(e) => handleConfigChange('sheetName', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Deja en blanco para usar la primera hoja</p>
            </div>
        </div>
    );

    // Renderizar campos para CSV
    const renderCSVFields = () => (
        <div>
            <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Ruta del archivo</label>
                <input
                    type="text"
                    className="w-full p-2 border rounded"
                    placeholder="/ruta/al/archivo.csv"
                    value={config.filePath || ''}
                    onChange={(e) => handleConfigChange('filePath', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Ruta del archivo en el servidor</p>
            </div>
        </div>
    );
// Añade esto dentro del componente, justo antes del return final
const testConnection = async () => {
    try {
        // Crea una copia del config para la prueba
        const testResult = await executeSpreadsheetNode({data: {config}}, {});
        
        if (testResult.success) {
            alert(`Conexión exitosa: ${testResult.message}`);
        } else {
            alert(`Error en la conexión: ${testResult.message}`);
        }
    } catch (error) {
        alert(`Error al probar la conexión: ${error.message}`);
    }
};

// Y añade este botón al final del JSX retornado
<button 
    className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    onClick={testConnection}
>
    Probar conexión
</button>
    return (
        <div>
            <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Tipo de servicio</label>
                <select
                    className="w-full p-2 border rounded"
                    value={config.serviceType || ''}
                    onChange={(e) => handleConfigChange('serviceType', e.target.value)}
                >
                    <option value="">Seleccionar</option>
                    <option value="google">Google Sheets</option>
                    <option value="excel_online">Excel Online</option>
                    <option value="excel_file">Archivo Excel</option>
                    <option value="csv">Archivo CSV</option>
                    <option value="mock">Datos de Prueba</option>
                </select>
            </div>

            {/* Campos específicos según el tipo de servicio */}
            {config.serviceType === 'google' && renderGoogleSheetsFields()}
            {config.serviceType === 'excel_online' && renderExcelOnlineFields()}
            {config.serviceType === 'excel_file' && renderExcelFileFields()}
            {config.serviceType === 'csv' && renderCSVFields()}
        </div>
    );
};

// Exporta tanto la función como el componente
export { executeSpreadsheetNode };
export default SpreadsheetNodeConfig;