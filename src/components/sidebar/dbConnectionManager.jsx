// dbConnectionManager.js
import mysql from 'mysql2/promise';
import { Client } from 'pg';
import { MongoClient } from 'mongodb';

/**
 * Clase para gestionar conexiones a diferentes tipos de bases de datos
 * Soporta: MySQL, PostgreSQL y MongoDB
 */
class DbConnectionManager {
  /**
   * Crea una conexión basada en la configuración proporcionada
   * @param {Object} config Configuración de la base de datos
   * @returns {Promise<Object>} Objeto de conexión y cliente
   */
  async createConnection(config) {
    const { type, host, port, username, password, database } = config;
    
    try {
      let connection = null;
      let client = null;
      
      switch (type.toLowerCase()) {
        case 'mysql':
          connection = await mysql.createConnection({
            host,
            port: port || 3306,
            user: username,
            password,
            database
          });
          return { connection, client: connection };
          
        case 'postgres':
          client = new Client({
            host,
            port: port || 5432,
            user: username,
            password,
            database
          });
          await client.connect();
          return { connection: null, client };
          
        case 'mongodb':
          const mongoUrl = `mongodb://${username}:${password}@${host}:${port || 27017}/${database}`;
          client = new MongoClient(mongoUrl);
          await client.connect();
          connection = client.db(database);
          return { connection, client };
          
        default:
          throw new Error(`Tipo de base de datos no soportado: ${type}. Solo se soporta MySQL, PostgreSQL y MongoDB.`);
      }
    } catch (error) {
      console.error(`Error al conectar a la base de datos ${type}:`, error);
      throw new Error(`Error de conexión: ${error.message}`);
    }
  }
  
  /**
   * Cierra la conexión a la base de datos
   * @param {Object} connectionInfo Información de conexión
   * @param {string} dbType Tipo de base de datos
   */
  async closeConnection(connectionInfo, dbType) {
    try {
      const { connection, client } = connectionInfo;
      
      switch (dbType.toLowerCase()) {
        case 'mysql':
          await connection.end();
          break;
          
        case 'postgres':
          await client.end();
          break;
          
        case 'mongodb':
          await client.close();
          break;
          
        default:
          console.warn(`Tipo de base de datos desconocido al cerrar: ${dbType}`);
      }
    } catch (error) {
      console.error(`Error al cerrar la conexión ${dbType}:`, error);
    }
  }
  
  /**
   * Ejecuta una consulta en la base de datos
   * @param {Object} connectionInfo Información de conexión
   * @param {string} dbType Tipo de base de datos
   * @param {string} query Consulta SQL o consulta de base de datos
   * @returns {Promise<Object>} Resultado de la consulta
   */
  async executeQuery(connectionInfo, dbType, query) {
    const { connection, client } = connectionInfo;
    let result = null;
    
    try {
      switch (dbType.toLowerCase()) {
        case 'mysql':
          const [rows, fields] = await connection.execute(query);
          result = {
            success: true,
            data: rows,
            fields,
            rowsAffected: rows.affectedRows || rows.length,
            operation: this.determineOperationType(query)
          };
          break;
          
        case 'postgres':
          const pgResult = await client.query(query);
          result = {
            success: true,
            data: pgResult.rows,
            rowsAffected: pgResult.rowCount,
            operation: this.determineOperationType(query)
          };
          break;
          
        case 'mongodb':
          // Para MongoDB, necesitamos parsear la consulta como JSON o usar un formato específico
          try {
            if (query.toLowerCase().startsWith('find')) {
              const parts = query.split(' ');
              const collection = parts[1];
              let filter = {};
              
              // Verificar si hay un filtro JSON en la consulta
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
              result = {
                success: true,
                data: docs,
                rowsAffected: docs.length,
                operation: 'find'
              };
            } else if (query.toLowerCase().startsWith('insert')) {
              const parts = query.split(' ');
              const collection = parts[1];
              let document = {};
              
              // Extraer el documento a insertar
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
              
              const insertResult = await connection.collection(collection).insertOne(document);
              result = {
                success: true,
                data: { insertedId: insertResult.insertedId },
                rowsAffected: insertResult.insertedCount,
                operation: 'insert'
              };
            } else if (query.toLowerCase().startsWith('update')) {
              const parts = query.split(' ');
              const collection = parts[1];
              let filter = {};
              let update = {};
              
              // Extraer el filtro y la actualización
              const filterStart = query.indexOf('{', query.indexOf('update'));
              const filterEnd = query.indexOf('}', filterStart);
              const updateStart = query.indexOf('{', filterEnd);
              const updateEnd = query.lastIndexOf('}');
              
              if (filterStart > -1 && filterEnd > -1 && updateStart > -1 && updateEnd > -1) {
                try {
                  filter = JSON.parse(query.substring(filterStart, filterEnd + 1));
                  update = JSON.parse(query.substring(updateStart, updateEnd + 1));
                } catch (e) {
                  console.warn('Error al parsear JSON para update:', e);
                }
              }
              
              const updateResult = await connection.collection(collection).updateMany(filter, update);
              result = {
                success: true,
                data: { 
                  matchedCount: updateResult.matchedCount,
                  modifiedCount: updateResult.modifiedCount
                },
                rowsAffected: updateResult.modifiedCount,
                operation: 'update'
              };
            } else if (query.toLowerCase().startsWith('delete')) {
              const parts = query.split(' ');
              const collection = parts[1];
              let filter = {};
              
              // Extraer el filtro
              if (query.includes('{') && query.includes('}')) {
                const filterStart = query.indexOf('{');
                const filterEnd = query.lastIndexOf('}');
                if (filterStart > -1 && filterEnd > -1) {
                  try {
                    filter = JSON.parse(query.substring(filterStart, filterEnd + 1));
                  } catch (e) {
                    console.warn('Error al parsear filtro JSON para delete:', e);
                  }
                }
              }
              
              const deleteResult = await connection.collection(collection).deleteMany(filter);
              result = {
                success: true,
                data: { deletedCount: deleteResult.deletedCount },
                rowsAffected: deleteResult.deletedCount,
                operation: 'delete'
              };
            } else {
              throw new Error(`Operación MongoDB no reconocida: ${query}`);
            }
          } catch (mongoError) {
            console.error('Error en operación MongoDB:', mongoError);
            throw new Error(`Error en MongoDB: ${mongoError.message}`);
          }
          break;
          
        default:
          throw new Error(`Tipo de base de datos no soportado: ${dbType}`);
      }
      
      return result;
    } catch (error) {
      console.error(`Error al ejecutar consulta en ${dbType}:`, error);
      throw new Error(`Error en consulta: ${error.message}`);
    }
  }
  
  /**
   * Determina el tipo de operación basado en la consulta SQL
   * @param {string} query Consulta SQL
   * @returns {string} Tipo de operación
   */
  determineOperationType(query) {
    const sqlLower = query.toLowerCase().trim();
    
    if (sqlLower.startsWith('select')) return 'select';
    if (sqlLower.startsWith('insert')) return 'insert';
    if (sqlLower.startsWith('update')) return 'update';
    if (sqlLower.startsWith('delete')) return 'delete';
    if (sqlLower.startsWith('create')) return 'create';
    if (sqlLower.startsWith('alter')) return 'alter';
    if (sqlLower.startsWith('drop')) return 'drop';
    if (sqlLower.startsWith('truncate')) return 'truncate';
    
    return 'unknown';
  }
  
  /**
   * Prueba la conexión a la base de datos
   * @param {Object} config Configuración de conexión
   * @returns {Promise<Object>} Resultado de la prueba
   */
  async testConnection(config) {
    try {
      const connectionInfo = await this.createConnection(config);
      await this.closeConnection(connectionInfo, config.type);
      
      return {
        success: true,
        message: `Conexión exitosa a ${config.type} en ${config.host}:${config.port}/${config.database}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Error de conexión: ${error.message}`
      };
    }
  }
  
  /**
   * Obtiene información sobre los controladores de base de datos disponibles
   * @returns {Object} Información sobre controladores
   */
  getDatabaseDriversInfo() {
    return {
      mysql: {
        name: 'MySQL',
        defaultPort: 3306,
        requiresDatabase: true,
        supportsSSL: true
      },
      postgres: {
        name: 'PostgreSQL',
        defaultPort: 5432,
        requiresDatabase: true,
        supportsSSL: true
      },
      mongodb: {
        name: 'MongoDB',
        defaultPort: 27017,
        requiresDatabase: true,
        supportsSSL: true
      }
    };
  }
}

export default new DbConnectionManager();