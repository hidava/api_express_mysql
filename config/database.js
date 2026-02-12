/**
 * Configuración de Conexión a MySQL con Pool (mysql2)
 *
 * Utiliza un patrón singleton para asegurar que solo se cree un Pool de conexión.
 */
const mysql = require('mysql2/promise');

// --- CONFIGURACIÓN (LEER DESDE VARIABLES DE ENTORNO) ---
const dbConfig = {
    host: process.env.DB_HOST || 'localhost', // O la IP/URL de tu servidor MySQL
    user: process.env.DB_USER || 'root',      // Tu usuario de MySQL
    password: process.env.DB_PASS || '',      // Contraseña de MySQL (poner en .env en producción)
    database: process.env.DB_NAME || 'usuarios_db', // Nombre de la base de datos
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    waitForConnections: true,
    connectionLimit: process.env.DB_CONN_LIMIT ? parseInt(process.env.DB_CONN_LIMIT, 10) : 10,
    queueLimit: 0,
    // Permite que MySQL devuelva valores booleanos y evita problemas con fechas y JSON
    dateStrings: true,
    namedPlaceholders: true
};

let dbPool = null;

/**
 * Retorna el Pool de conexión a la base de datos (Singleton).
 * @returns {mysql.Pool} El pool de conexiones.
 */
const getDB = () => {
    if (dbPool === null) {
        try {
            // Se inicializa el Pool si aún no existe
            dbPool = mysql.createPool(dbConfig);
            console.log("Conexión a MySQL (Pool) establecida.");
        } catch (error) {
            console.error("ERROR AL CREAR EL POOL DE CONEXIONES:", error);
            // Re-lanzamos para que el proceso de inicialización en server.js falle
            throw error; 
        }
    }
    return dbPool;
};

/**
 * Función para inicializar/conectar la DB.
 * Mantiene la compatibilidad con el código initializeApp de server.js.
 * @returns {Promise<void>}
 */
const connectDB = async () => {
    try {
        const pool = getDB();
        // Intentamos una consulta simple para validar la conexión de forma asíncrona.
        await pool.query('SELECT 1');
        console.log("✅ Conexión a la base de datos verificada exitosamente.");
    } catch (error) {
        console.error("❌ Fallo en la verificación de conexión a MySQL:", error);
        throw new Error(`Fallo en la conexión a MySQL: ${error.message}`);
    }
};


/**
 * Retorna una conexión de Pool para usar en Transacciones.
 * @returns {Promise<mysql.PoolConnection>} Una conexión reservada del pool.
 */
const getConnection = async () => {
    // Usamos getDB() para asegurar que el pool esté inicializado
    return getDB().getConnection();
};

// Exportar 'pool' para compatibilidad con módulos legacy que lo usan
const pool = getDB();

module.exports = {
    getDB,
    getConnection,
    connectDB, // Exportamos connectDB para el server.js
    pool
};
