// dbApiService.js - Servicio para simular operaciones de base de datos en el navegador
// Colocar este archivo en src/services/
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
/**
 * Servicio para simular operaciones de base de datos
 */
const dbApiService = {
  // Nueva función para verificar el estado del servidor
  checkServiceStatus: async () => {
    try {
      const response = await fetch(`${API_URL}/status`);

      if (response.ok) {
        const data = await response.json();
        return {
          active: true,
          mode: "server",
          message: data.message || "Servidor backend activo"
        };
      } else {
        throw new Error("El servidor respondió con un error");
      }
    } catch (error) {
      console.log("Error al verificar estado del servicio:", error);
      return {
        active: false,
        mode: "simulation",
        message: "No se pudo conectar al servidor. Usando modo simulación."
      };
    }
  },


  /**
   * Simula la prueba de conexión a una base de datos
   * @param {Object} config - Configuración de la conexión
   * @returns {Promise<Object>} - Resultado de la prueba
   */
  testConnection: async (config) => {
    try {
      // Intentar usar el servidor real
      const response = await fetch(`${API_URL}/database/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      return await response.json();
    } catch (error) {
      console.log("Error al contactar servidor, usando simulación:", error);

      // Fallback a simulación si el servidor no está disponible
      console.log('[DB API] Simulando prueba de conexión:', { ...config, password: '******' });
      await new Promise(resolve => setTimeout(resolve, 1000));

      const success = Math.random() > 0.2;
      return {
        success: success,
        message: success
          ? `Conexión exitosa a ${config.type} en ${config.host}:${config.port}/${config.database} (simulado)`
          : `Error al conectar a ${config.type}: ${getRandomError(config.type)} (simulado)`
      };
    }
  },
  /**
   * Simula la ejecución de una consulta en la base de datos
   * @param {Object} config - Configuración de la conexión
   * @param {string} query - Consulta a ejecutar
   * @returns {Promise<Object>} - Resultado de la consulta
   */
  executeQuery: async (config, query) => {
    console.log('[DB API] Ejecutando consulta:', query);
    console.log('[DB API] Configuración:', { ...config, password: '******' });

    try {
      // Intentar usar el servidor real
      const response = await fetch('http://localhost:3001/api/database/execute-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, query })
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      // Si la respuesta es exitosa, devolver los datos del servidor
      return await response.json();

    } catch (error) {
      // Si hay un error al conectar con el servidor, usar simulación
      console.log('[DB API] Error al conectar con el servidor, usando simulación:', error.message);

      // // Simular tiempo de respuesta de red
      // await new Promise(resolve => setTimeout(resolve, 1500));

      // // Determinar el tipo de operación
      // const operation = determineOperationType(config.type, query);

      // // Generar resultados simulados basados en el tipo de operación
      // let result;

      try {
        if (operation === 'select' || operation === 'find') {
          // Consulta de selección (SELECT o find)
          result = {
            success: true,
            data: generateMockRecords(10),
            rowsAffected: 10,
            operation: operation
          };
        } else if (operation === 'insert') {
          // Inserción (INSERT o insert)
          result = {
            success: true,
            data: { insertId: Math.floor(Math.random() * 1000) + 1 },
            rowsAffected: 1,
            operation: operation
          };
        } else if (operation === 'update') {
          // Actualización (UPDATE o update)
          const rowsAffected = Math.floor(Math.random() * 5) + 1;
          result = {
            success: true,
            data: { affectedRows: rowsAffected },
            rowsAffected: rowsAffected,
            operation: operation
          };
        } else if (operation === 'delete') {
          // Eliminación (DELETE o delete)
          const rowsAffected = Math.floor(Math.random() * 3) + 1;
          result = {
            success: true,
            data: { affectedRows: rowsAffected },
            rowsAffected: rowsAffected,
            operation: operation
          };
        } else {
          // Otra operación
          result = {
            success: true,
            data: { message: 'Operación ejecutada' },
            rowsAffected: 0,
            operation: operation
          };
        }

        return result;
      } catch (simulationError) {
        return {
          success: false,
          error: `Error al ejecutar la consulta: ${simulationError.message}`,
          data: null
        };
      }
    }
  }
};

/**
 * Determina el tipo de operación basado en la consulta
 * @param {string} dbType - Tipo de base de datos
 * @param {string} query - Consulta a analizar
 * @returns {string} - Tipo de operación
 */
function determineOperationType(dbType, query) {
  const queryLower = query.toLowerCase().trim();

  if (dbType === 'mongodb') {
    // Operaciones MongoDB
    if (queryLower.startsWith('find')) return 'find';
    if (queryLower.startsWith('insert')) return 'insert';
    if (queryLower.startsWith('update')) return 'update';
    if (queryLower.startsWith('delete')) return 'delete';
    return 'unknown';
  } else {
    // Operaciones SQL
    if (queryLower.startsWith('select')) return 'select';
    if (queryLower.startsWith('insert')) return 'insert';
    if (queryLower.startsWith('update')) return 'update';
    if (queryLower.startsWith('delete')) return 'delete';
    if (queryLower.startsWith('create')) return 'create';
    if (queryLower.startsWith('alter')) return 'alter';
    if (queryLower.startsWith('drop')) return 'drop';
    return 'unknown';
  }
}

/**
 * Genera registros simulados para pruebas
 * @param {number} count - Número de registros a generar
 * @returns {Array} - Array de registros
 */
function generateMockRecords(count) {
  // Nombres de ejemplo
  const nombres = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Laura', 'Pedro', 'Sofia', 'Miguel', 'Elena'];

  // Apellidos de ejemplo
  const apellidos = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez', 'Fernández', 'Ramírez', 'Torres'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    nombre: nombres[Math.floor(Math.random() * nombres.length)],
    apellido: apellidos[Math.floor(Math.random() * apellidos.length)],
    email: `usuario${i + 1}@ejemplo.com`,
    edad: Math.floor(Math.random() * 50) + 18,
    fecha_registro: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    activo: Math.random() > 0.3
  }));
}

/**
 * Genera un error aleatorio basado en el tipo de base de datos
 * @param {string} dbType - Tipo de base de datos
 * @returns {string} - Mensaje de error
 */
function getRandomError(dbType) {
  const generalErrors = [
    'Tiempo de espera agotado',
    'Error de autenticación',
    'Base de datos no encontrada',
    'Permisos insuficientes'
  ];

  const dbSpecificErrors = {
    mysql: [
      'Access denied for user',
      'Unknown database',
      'Too many connections'
    ],
    postgres: [
      'FATAL: password authentication failed',
      'database does not exist',
      'role does not exist'
    ],
    mongodb: [
      'Authentication failed',
      'ECONNREFUSED',
      'not authorized on database'
    ],
    sqlserver: [
      'Login failed for user',
      'Cannot open database',
      'Connection timeout'
    ],
    oracle: [
      'ORA-01017: invalid username/password',
      'ORA-12541: TNS:no listener',
      'ORA-12514: TNS:listener does not currently know of service'
    ]
  };

  const specificErrors = dbSpecificErrors[dbType] || [];
  const allErrors = [...generalErrors, ...specificErrors];

  return allErrors[Math.floor(Math.random() * allErrors.length)];
}
export default dbApiService;