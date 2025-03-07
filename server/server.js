// server/server.js
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import axios from 'axios';
import XLSX from 'xlsx';
import fs from 'fs/promises';
import Papa from 'papaparse';
import multer from 'multer';
import { dirname, join } from 'path';

// Inicializar dotenv
dotenv.config();

// Inicializar Express - PRIMERO antes de usarlo
const app = express();

// Obtener la ruta del directorio actual (necesario en módulos ES)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middlewares esenciales (DESPUÉS de inicializar app)
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// IMPORTANTE: Estos middlewares deben estar presentes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Crear directorio para archivos temporales si no existe
const uploadDir = join(__dirname, 'temp_uploads');
try {
    await fs.mkdir(uploadDir, { recursive: true });
    console.log('Directorio de uploads creado:', uploadDir);
} catch (err) {
    console.error('Error al crear directorio de uploads:', err);
}

// Configurar multer para almacenar archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generar nombre único para el archivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = file.originalname.split('.').pop();
        cb(null, `${uniqueSuffix}.${ext}`);
    }
});

// Crear middleware de carga de archivos
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
    fileFilter: (req, file, cb) => {
        // Verificar tipo de archivo
        const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        const allowedExtensions = ['.csv', '.xlsx', '.xls'];
        const ext = '.' + file.originalname.split('.').pop().toLowerCase();

        if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Formato de archivo no soportado. Solo se permiten CSV, XLS y XLSX.'));
        }
    }
});

// Endpoint para verificar el estado del servidor
app.get('/api/status', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Servidor en línea',
        timestamp: new Date().toISOString()
    });
});

// Endpoint para operaciones de Google Sheets
app.post('/api/spreadsheet/google-sheets', async (req, res) => {
    const config = req.body;

    try {
        // Validar configuración requerida
        if (!config.spreadsheetId) {
            return res.status(400).json({
                success: false,
                message: 'Falta ID de hoja de cálculo'
            });
        }

        // Parsear credenciales si existen
        let credentials;
        if (config.credentials) {
            credentials = typeof config.credentials === 'string'
                ? JSON.parse(config.credentials)
                : config.credentials;
        }

        // Para operaciones de sólo lectura en hojas públicas, no se requieren credenciales
        let googleSheets;

        if (credentials) {
            // Autenticar con Google Sheets API usando credenciales
            const client = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
            googleSheets = google.sheets({ version: 'v4', auth: client });
        } else {
            // Para hojas públicas, operaciones de sólo lectura
            googleSheets = google.sheets({ version: 'v4' });
        }

        // Realizar operación según configuración
        let result;
        switch (config.operation) {
            case 'read':
                const response = await googleSheets.spreadsheets.values.get({
                    spreadsheetId: config.spreadsheetId,
                    range: config.range || 'Sheet1', // Valor por defecto
                });
                result = {
                    success: true,
                    data: response.data.values,
                    rowCount: response.data.values?.length || 0,
                    message: 'Datos leídos exitosamente'
                };
                break;

            case 'append':
                if (!credentials) {
                    return res.status(400).json({
                        success: false,
                        message: 'Se requieren credenciales para operaciones de escritura'
                    });
                }

                const appendResponse = await googleSheets.spreadsheets.values.append({
                    spreadsheetId: config.spreadsheetId,
                    range: config.range || 'Sheet1',
                    valueInputOption: 'RAW',
                    insertDataOption: 'INSERT_ROWS',
                    resource: {
                        values: config.appendData
                    }
                });
                result = {
                    success: true,
                    rowCount: appendResponse.data.updates.updatedRows,
                    message: 'Filas añadidas exitosamente'
                };
                break;

            case 'update':
                if (!credentials) {
                    return res.status(400).json({
                        success: false,
                        message: 'Se requieren credenciales para operaciones de escritura'
                    });
                }

                const updateResponse = await googleSheets.spreadsheets.values.update({
                    spreadsheetId: config.spreadsheetId,
                    range: config.range || 'Sheet1',
                    valueInputOption: 'RAW',
                    resource: {
                        values: config.updateValues
                    }
                });
                result = {
                    success: true,
                    rowCount: updateResponse.data.updatedCells,
                    message: 'Celdas actualizadas exitosamente'
                };
                break;

            case 'clear':
                if (!credentials) {
                    return res.status(400).json({
                        success: false,
                        message: 'Se requieren credenciales para operaciones de escritura'
                    });
                }

                const clearResponse = await googleSheets.spreadsheets.values.clear({
                    spreadsheetId: config.spreadsheetId,
                    range: config.range || 'Sheet1',
                });
                result = {
                    success: true,
                    message: 'Rango borrado exitosamente'
                };
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Operación no soportada para Google Sheets'
                });
        }

        res.json(result);
    } catch (error) {
        console.error('Error en operación de Google Sheets:', error);
        res.status(500).json({
            success: false,
            message: `Error: ${error.message}`,
            error: error.toString()
        });
    }
});

// Endpoint para operaciones de Excel Online
app.post('/api/spreadsheet/excel-online', async (req, res) => {
    const config = req.body;

    try {
        // Validar configuración requerida
        if (!config.fileUrl) {
            return res.status(400).json({
                success: false,
                message: 'Falta URL del archivo'
            });
        }

        // Opciones para la petición
        const options = {};
        if (config.accessToken) {
            options.headers = { 'Authorization': `Bearer ${config.accessToken}` };
        }
        options.responseType = 'arraybuffer';

        // Descargar archivo Excel desde origen online
        const response = await axios.get(config.fileUrl, options);

        // Parsear archivo Excel
        const workbook = XLSX.read(response.data, { type: 'buffer' });
        const worksheet = workbook.Sheets[config.sheetName || workbook.SheetNames[0]];

        // Convertir a array de arrays
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        res.json({
            success: true,
            data,
            rowCount: data.length,
            message: 'Datos leídos exitosamente'
        });
    } catch (error) {
        console.error('Error en operación de Excel Online:', error);
        res.status(500).json({
            success: false,
            message: `Error: ${error.message}`,
            error: error.toString()
        });
    }
});

// Endpoint para operaciones de archivo Excel local
app.post('/api/spreadsheet/excel-file', async (req, res) => {
    const config = req.body;
    console.log("Recibida solicitud para archivo Excel:", config);
    try {
        // Validar configuración requerida
        if (!config.filePath) {
            console.error("Ruta de archivo no proporcionada");
            return res.status(400).json({
                success: false,
                message: 'Ruta de archivo no especificada'
            });
        }

        // Verificar que el archivo existe
        try {
            await fs.access(config.filePath);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'Archivo no encontrado o no accesible'
            });
        }

        // Leer archivo
        const fileBuffer = await fs.readFile(config.filePath);

        // Parsear archivo Excel
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const worksheet = workbook.Sheets[config.sheetName || workbook.SheetNames[0]];

        // Convertir a array de arrays
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        res.json({
            success: true,
            data,
            rowCount: data.length,
            message: 'Datos leídos exitosamente'
        });
    } catch (error) {
        console.error('Error en operación de archivo Excel:', error);
        res.status(500).json({
            success: false,
            message: `Error: ${error.message}`,
            error: error.toString()
        });
    }
});

// Endpoint para operaciones de archivo CSV
app.post('/api/spreadsheet/csv', async (req, res) => {
    const config = req.body;

    try {
        // Validar configuración requerida
        if (!config.filePath) {
            return res.status(400).json({
                success: false,
                message: 'Ruta de archivo no especificada'
            });
        }

        // Leer archivo
        const fileContent = await fs.readFile(config.filePath, 'utf8');

        // Parsear CSV con promesa para manejar correctamente respuestas asíncronas
        const parsePromise = new Promise((resolve, reject) => {
            Papa.parse(fileContent, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => resolve(results),
                error: (error) => reject(error)
            });
        });

        const results = await parsePromise;

        res.json({
            success: true,
            data: results.data,
            rowCount: results.data.length,
            message: 'Datos CSV leídos exitosamente'
        });
    } catch (error) {
        console.error('Error en operación de archivo CSV:', error);
        res.status(500).json({
            success: false,
            message: `Error: ${error.message}`,
            error: error.toString()
        });
    }
});

// Endpoint para subir archivos
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No se recibió ningún archivo'
        });
    }
    
    // Devolver información del archivo
    res.json({
        success: true,
        filePath: req.file.path,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        message: 'Archivo subido correctamente'
    });
});

// En server.js, añade este nuevo endpoint para datos de prueba
app.post('/api/spreadsheet/mock', (req, res) => {
    res.json({
        success: true,
        data: [
            ["Nombre", "Edad", "Ciudad"],
            ["Juan", 30, "Madrid"],
            ["Ana", 25, "Barcelona"],
            ["Pedro", 40, "Valencia"],
            ["María", 22, "Sevilla"]
        ],
        rowCount: 5,
        message: 'Datos de prueba cargados exitosamente'
    });
});

app.get('/api/spreadsheet/mock1', (req, res) => {
    res.json({
        success: true,
        data: [
            ["Nombre", "Edad", "Ciudad"],
            ["Juan", 30, "Madrid"],
            ["Ana", 25, "Barcelona"],
            ["Pedro", 40, "Valencia"],
            ["María", 22, "Sevilla"]
        ],
        rowCount: 5,
        message: 'Datos de prueba cargados exitosamente (GET)'
    });
});

// Ruta básica para verificar que el servidor está funcionando
app.get('/', (req, res) => {
    res.send('API de Workflow Builder funcionando correctamente');
});

// Iniciar servidor
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Servidor iniciado en http://localhost:${port}`);
});