import { google } from 'googleapis';
import axios from 'axios';
import XLSX from 'xlsx';
import Papa from 'papaparse';
import fs from 'fs/promises';

async function executeSpreadsheetNode(node, inputs, options = {}) {
    const config = node.data?.config || {};
    
    try {
        switch (config.serviceType) {
            case 'google':
                return await executeGoogleSheetsOperation(config);
            
            case 'excel_online':
                return await executeExcelOnlineOperation(config);
            
            case 'excel_file':
                return await executeExcelFileOperation(config);
            
            case 'csv':
                return await executeCSVOperation(config);
            
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

async function executeGoogleSheetsOperation(config) {
    // Validate required configuration
    if (!config.spreadsheetId || !config.credentials) {
        throw new Error('Faltan credenciales o ID de hoja de cálculo');
    }

    // Parse credentials
    const credentials = typeof config.credentials === 'string' 
        ? JSON.parse(config.credentials) 
        : config.credentials;

    // Authenticate with Google Sheets API
    const client = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const googleSheets = google.sheets({ version: 'v4', auth: client });

    // Perform operation based on config
    switch (config.operation) {
        case 'read':
            const response = await googleSheets.spreadsheets.values.get({
                spreadsheetId: config.spreadsheetId,
                range: config.range || config.sheetName,
            });
            return {
                success: true,
                data: response.data.values,
                rowCount: response.data.values?.length || 0,
                message: 'Datos leídos exitosamente'
            };
        
        case 'append':
            const appendResponse = await googleSheets.spreadsheets.values.append({
                spreadsheetId: config.spreadsheetId,
                range: config.range || config.sheetName,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: config.appendData
                }
            });
            return {
                success: true,
                rowCount: appendResponse.data.updates.updatedRows,
                message: 'Filas añadidas exitosamente'
            };
        
        case 'update':
            const updateResponse = await googleSheets.spreadsheets.values.update({
                spreadsheetId: config.spreadsheetId,
                range: config.range || config.sheetName,
                valueInputOption: 'RAW',
                resource: {
                    values: Object.entries(config.updateValues).map(([, value]) => [value])
                }
            });
            return {
                success: true,
                rowCount: updateResponse.data.updatedCells,
                message: 'Celdas actualizadas exitosamente'
            };
        
        case 'clear':
            const clearResponse = await googleSheets.spreadsheets.values.clear({
                spreadsheetId: config.spreadsheetId,
                range: config.range || config.sheetName,
            });
            return {
                success: true,
                message: 'Rango borrado exitosamente'
            };
        
        default:
            throw new Error('Operación no soportada para Google Sheets');
    }
}

async function executeExcelOnlineOperation(config) {
    // Validate required configuration
    if (!config.fileUrl || !config.accessToken) {
        throw new Error('Faltan URL o token de acceso');
    }

    // Fetch Excel file from online source
    const response = await axios.get(config.fileUrl, {
        headers: { 'Authorization': `Bearer ${config.accessToken}` },
        responseType: 'arraybuffer'
    });

    // Parse Excel file
    const workbook = XLSX.read(response.data, { type: 'buffer' });
    const worksheet = workbook.Sheets[config.sheetName || workbook.SheetNames[0]];
    
    // Convert to array of arrays
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    return {
        success: true,
        data,
        rowCount: data.length,
        message: 'Datos leídos exitosamente'
    };
}

async function executeExcelFileOperation(config) {
    // For local Excel file operations
    if (!config.filePath) {
        throw new Error('Ruta de archivo no especificada');
    }

    // Read file
    const fileBuffer = await fs.readFile(config.filePath);
    
    // Parse Excel file
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[config.sheetName || workbook.SheetNames[0]];
    
    // Convert to array of arrays
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    return {
        success: true,
        data,
        rowCount: data.length,
        message: 'Datos leídos exitosamente'
    };
}

async function executeCSVOperation(config) {
    // For CSV file operations
    if (!config.filePath) {
        throw new Error('Ruta de archivo no especificada');
    }

    // Read file
    const fileContent = await fs.readFile(config.filePath, 'utf8');
    
    // Parse CSV
    return new Promise((resolve, reject) => {
        Papa.parse(fileContent, {
            complete: (results) => {
                resolve({
                    success: true,
                    data: results.data,
                    rowCount: results.data.length,
                    message: 'Datos CSV leídos exitosamente'
                });
            },
            error: (error) => {
                reject({
                    success: false,
                    message: 'Error al parsear CSV',
                    error
                });
            }
        });
    });
}

export { executeSpreadsheetNode };