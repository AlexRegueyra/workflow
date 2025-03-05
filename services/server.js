// server.js - Servidor Express para conexiones a bases de datos y servicios externos
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const { Client } = require('pg');
const { MongoClient } = require('mongodb');

// Crear aplicación Express
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Permitir CORS para que el frontend pueda conectarse
app.use(bodyParser.json({ limit: '10mb' })); // Aumentar límite para consultas grandes

// ====== Rutas para Bases de Datos ======

/**
 * Prueba conexión a base de datos
 * POST /api/database/test-connection
 */
app.post('/api/database/test-connection', async (req, res) => {
  console.log('Probando conexión a base de datos:', { ...req.body, password: '******' });
  
  try {
    const result = await testDatabaseConnection(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error al probar conexión:', error);
    res.status(500).json({
      success: false,
      message: `Error: ${error.message}`
    });
  }
});

/**
 * Ejecuta consulta en base de datos
 * POST /api/database/execute-query
 */
app.post('/api/database/execute-query', async (req, res) => {
  const { config, query } = req.body;
  console.log('Ejecutando consulta:', query);
  console.log('Configuración:', { ...config, password: '******' });
  
  try {
    const result = await executeDatabaseQuery(config, query);
    res.json(result);
  } catch (error) {
    console.error('Error al ejecutar consulta:', error);
    res.status(500).json({
      success: false,
      message: `Error: ${error.message}`,
      error: error.message
    });
  }
});

// ====== Funciones de Base de Datos ======

/**
 * Prueba conexión a base de datos
 */
async function testDatabaseConnection(config) {
  const { type, host, port, username, password, database } = config;
  
  let connection = null;
  
  try {
    switch (type.toLowerCase()) {
      case 'mysql':
        connection = await mysql.createConnection({
          host,
          port: port || 3306,
          user: username,
          password,
          database
        });
        await connection.end();
        break;
        
      case 'postgres':
        const pgClient = new Client({
          host,
          port: port || 5432,
          user: username,
          password,
          database
        });
        await pgClient.connect();
        await pgClient.end();
        break;
        
      case 'mongodb':
        const mongoUrl = `mongodb://${username}:${password}@${host}:${port || 27017}/${database}`;
        const mongoClient = new MongoClient(mongoUrl);
        await mongoClient.connect();
        await mongoClient.close();
        break;
        
      default:
        throw new Error(`Tipo de base de datos no soportado: ${type}`);
    }
    
    return {
      success: true,
      message: `Conexión exitosa a ${type} en ${host}:${port}/${database}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Error de conexión: ${error.message}`
    };
  }
}

/**
 * Ejecuta consulta en base de datos
 */
async function executeDatabaseQuery(config, query) {
  const { type, host, port, username, password, database } = config;
  
  let connection = null;
  let client = null;
  
  try {
    switch (type.toLowerCase()) {
      case 'mysql':
        connection = await mysql.createConnection({
          host,
          port: port || 3306,
          user: username,
          password,
          database
        });
        
        try {
          const [rows, fields] = await connection.execute(query);
          return {
            success: true,
            data: rows,
            fields,
            rowsAffected: rows.affectedRows || rows.length,
            operation: determineOperationType(query)
          };
        } finally {
          if (connection) await connection.end();
        }
        
      case 'postgres':
        client = new Client({
          host,
          port: port || 5432,
          user: username,
          password,
          database
        });
        
        try {
          await client.connect();
          const result = await client.query(query);
          return {
            success: true,
            data: result.rows,
            rowsAffected: result.rowCount,
            operation: determineOperationType(query)
          };
        } finally {
          if (client) await client.end();
        }
        
      case 'mongodb':
        const mongoUrl = `mongodb://${username}:${password}@${host}:${port || 27017}/${database}`;
        client = new MongoClient(mongoUrl);
        
        try {
          await client.connect();
          connection = client.db(database);
          
          // Para MongoDB, parsear la consulta
          if (query.toLowerCase().startsWith('find')) {
            const parts = query.split(' ');
            const collection = parts[1];
            let filter = {};
            
            // Verificar si hay un filtro JSON
            if (query.includes('{') && query.includes('}')) {
              const filterStart = query.indexOf('{');
              const filterEnd = query.lastIndexOf('}');
              if (filterStart > -1 && filterEnd > -1) {
                try {
                  filter = JSON.parse(query.substring(filterStart, filterEnd + 1));
                } catch (e) {
                  console.warn('Error al parsear filtro JSON:', e);
                }
              }
            }
            
            const docs = await connection.collection(collection).find(filter).toArray();
            return {
              success: true,
              data: docs,
              rowsAffected: docs.length,
              operation: 'find'
            };
          }
          
          if (query.toLowerCase().startsWith('insert')) {
            const parts = query.split(' ');
            const collection = parts[1];
            let document = {};
            
            if (query.includes('{') && query.includes('}')) {
              const docStart = query.indexOf('{');
              const docEnd = query.lastIndexOf('}');
              if (docStart > -1 && docEnd > -1) {
                try {
                  document = JSON.parse(query.substring(docStart, docEnd + 1));
                } catch (e) {
                  console.warn('Error al parsear documento JSON:', e);
                }
              }
            }
            
            const result = await connection.collection(collection).insertOne(document);
            return {
              success: true,
              data: { insertedId: result.insertedId },
              rowsAffected: result.insertedCount,
              operation: 'insert'
            };
          }
          
          throw new Error('Operación MongoDB no soportada');
        } finally {
          if (client) await client.close();
        }
        
      default:
        throw new Error(`Tipo de base de datos no soportado: ${type}`);
    }
  } catch (error) {
    throw new Error(`Error en consulta: ${error.message}`);
  }
}

/**
 * Determina el tipo de operación basado en la consulta
 */
function determineOperationType(query) {
  const sqlLower = query.toLowerCase().trim();
  
  if (sqlLower.startsWith('select')) return 'select';
  if (sqlLower.startsWith('insert')) return 'insert';
  if (sqlLower.startsWith('update')) return 'update';
  if (sqlLower.startsWith('delete')) return 'delete';
  if (sqlLower.startsWith('create')) return 'create';
  if (sqlLower.startsWith('alter')) return 'alter';
  if (sqlLower.startsWith('drop')) return 'drop';
  
  return 'unknown';
}

// ====== Rutas para Servicios Externos ======

/**
 * Telegram Bot API
 * POST /api/services/telegram/send-message
 */
app.post('/api/services/telegram/send-message', async (req, res) => {
  try {
    const { botToken, chatId, message } = req.body;
    
    // Validar parámetros
    if (!botToken || !chatId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere botToken, chatId y message'
      });
    }
    
    // Llamada a la API de Telegram
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.description || 'Error al enviar mensaje a Telegram');
    }
    
    res.json({
      success: true,
      data: data.result
    });
  } catch (error) {
    console.error('Error al enviar mensaje a Telegram:', error);
    res.status(500).json({
      success: false,
      message: `Error: ${error.message}`
    });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor iniciado en http://localhost:${port}`);
});

// Añade esta ruta a tu server.js
app.get('/api/status', (req, res) => {
  res.json({
    status: 'active',
    version: '1.0.0',
    message: 'Servidor de bases de datos activo'
  });
});