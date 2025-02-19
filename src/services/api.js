// src/services/apiService.js

/**
 * Clase para manejar peticiones a APIs externas
 */
export class ApiService {
    /**
     * Realiza una petición a una API
     * @param {Object} config - Configuración de la petición
     * @returns {Promise<Object>} - Respuesta de la API
     */
    static async request(config) {
        const {
            url,
            method = 'GET',
            headers = {},
            params = {},
            data = null,
            timeout = 30000,
            retry = 0
        } = config;

        if (!url) {
            throw new Error('URL es requerida');
        }

        // Construir URL con parámetros
        const fullUrl = this.buildUrl(url, params);

        // Opciones de fetch
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            signal: AbortSignal.timeout(timeout)
        };

        // Agregar body si es necesario
        if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(fullUrl, options);

            // Construir metadatos de respuesta
            const responseMetadata = {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                url: response.url
            };

            // Intentar parsear como JSON
            let responseData;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            // Verificar si la petición fue exitosa
            if (!response.ok) {
                throw {
                    message: `Error ${response.status}: ${response.statusText}`,
                    status: response.status,
                    data: responseData,
                    metadata: responseMetadata
                };
            }

            // Devolver datos y metadatos
            return {
                data: responseData,
                metadata: responseMetadata
            };
        } catch (error) {
            // Reintentar si está configurado
            if (retry > 0) {
                console.log(`Reintentando petición (${retry} intentos restantes)...`);
                return ApiService.request({
                    ...config,
                    retry: retry - 1
                });
            }

            // Formatear error
            return {
                error: true,
                message: error.message || 'Error en la petición',
                details: error
            };
        }
    }

    /**
     * Construye una URL con parámetros
     * @param {string} url - URL base
     * @param {Object} params - Parámetros a agregar
     * @returns {string} - URL completa
     */
    static buildUrl(url, params = {}) {
        if (Object.keys(params).length === 0) {
            return url;
        }

        const queryString = Object.entries(params)
            .filter(([_, value]) => value !== null && value !== undefined)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');

        return `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
    }

    /**
     * Realiza una petición GET
     * @param {string} url - URL de la petición
     * @param {Object} params - Parámetros para la URL
     * @param {Object} config - Configuración adicional
     * @returns {Promise<Object>} - Respuesta de la API
     */
    static get(url, params = {}, config = {}) {
        return this.request({
            url,
            method: 'GET',
            params,
            ...config
        });
    }

    /**
     * Realiza una petición POST
     * @param {string} url - URL de la petición
     * @param {Object} data - Datos a enviar
     * @param {Object} config - Configuración adicional
     * @returns {Promise<Object>} - Respuesta de la API
     */
    static post(url, data = {}, config = {}) {
        return this.request({
            url,
            method: 'POST',
            data,
            ...config
        });
    }

    /**
     * Realiza una petición PUT
     * @param {string} url - URL de la petición
     * @param {Object} data - Datos a enviar
     * @param {Object} config - Configuración adicional
     * @returns {Promise<Object>} - Respuesta de la API
     */
    static put(url, data = {}, config = {}) {
        return this.request({
            url,
            method: 'PUT',
            data,
            ...config
        });
    }

    /**
     * Realiza una petición DELETE
     * @param {string} url - URL de la petición
     * @param {Object} config - Configuración adicional
     * @returns {Promise<Object>} - Respuesta de la API
     */
    static delete(url, config = {}) {
        return this.request({
            url,
            method: 'DELETE',
            ...config
        });
    }
}

/**
 * Lista de APIs públicas y gratuitas para probar
 */
export const publicApis = [
    {
        name: 'Random User API',
        baseUrl: 'https://randomuser.me/api/',
        description: 'API para generar datos de usuarios aleatorios',
        endpoints: [
            {
                path: '',
                method: 'GET',
                description: 'Obtener usuarios aleatorios',
                params: {
                    results: '1-5000 (número de resultados)',
                    gender: 'male/female',
                    nat: 'nacionalidad (US, ES, FR, etc)'
                }
            }
        ]
    },
    {
        name: 'JSONPlaceholder',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        description: 'API REST fake para testing',
        endpoints: [
            {
                path: '/posts',
                method: 'GET',
                description: 'Obtener posts'
            },
            {
                path: '/posts/{id}',
                method: 'GET',
                description: 'Obtener un post específico'
            },
            {
                path: '/posts',
                method: 'POST',
                description: 'Crear un post',
                body: {
                    title: 'string',
                    body: 'string',
                    userId: 'number'
                }
            }
        ]
    },
    {
        name: 'OpenWeather',
        baseUrl: 'https://api.openweathermap.org/data/2.5/weather',
        description: 'API de clima (requiere ApiKey)',
        endpoints: [
            {
                path: '',
                method: 'GET',
                description: 'Obtener clima actual',
                params: {
                    q: 'ciudad,país',
                    appid: 'tu_api_key',
                    units: 'metric/imperial'
                }
            }
        ]
    },
    {
        name: 'REST Countries',
        baseUrl: 'https://restcountries.com/v3.1',
        description: 'Información sobre países',
        endpoints: [
            {
                path: '/all',
                method: 'GET',
                description: 'Obtener todos los países'
            },
            {
                path: '/name/{name}',
                method: 'GET',
                description: 'Buscar país por nombre'
            },
            {
                path: '/region/{region}',
                method: 'GET',
                description: 'Filtrar por región (Africa, Americas, Asia, Europe, Oceania)'
            }
        ]
    },
    {
        name: 'CoinGecko',
        baseUrl: 'https://api.coingecko.com/api/v3',
        description: 'API de criptomonedas',
        endpoints: [
            {
                path: '/coins/markets',
                method: 'GET',
                description: 'Obtener lista de monedas',
                params: {
                    vs_currency: 'usd/eur/etc',
                    order: 'market_cap_desc',
                    per_page: '1-250',
                    page: 'número de página'
                }
            },
            {
                path: '/coins/{id}',
                method: 'GET',
                description: 'Obtener info detallada de una moneda'
            }
        ]
    }
];

export default ApiService;