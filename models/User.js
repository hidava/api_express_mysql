/**
 * Modelo de Usuario (DAO - Data Access Object)
 * @description Maneja todas las operaciones CRUD para la entidad Usuario usando mysql2/pool.
 * Diseño: Usuarios solo guarda credenciales (email, password) y la FK propietarios_cedula.
 */

// Importamos getDB y getConnection del archivo de configuración de la base de datos.
const { getDB, getConnection } = require('../config/database'); 
// *** CORRECCIÓN CRÍTICA: Se ELIMINA la inicialización síncrona 'const pool = getDB();' ***
// Ahora, el pool se obtiene dentro de cada método justo antes de ser usado.


const User = {
    
    // Lista de campos seleccionables para consultas que NO requieren password
    userSelectFields: 'id, email, propietarios_cedula, fecha_creacion, fecha_actualizacion',

    /**
     * Función auxiliar para ejecutar consultas.
     * Si no se pasa una conexión (para transacciones), obtiene el Pool global (para lecturas).
     * @param {string} sql - Sentencia SQL a ejecutar.
     * @param {Array<any>} params - Parámetros de la consulta.
     * @param {mysql.PoolConnection | mysql.Pool} [connection] - Conexión de transacción o Pool global.
     * @returns {Promise<Array<Object>>} Filas resultantes.
     */
    async executeQuery(sql, params = [], connection = null) {
        // Obtenemos el Pool global si no se pasó una conexión de transacción
        const connectionOrPool = connection || getDB(); 
        
        try {
            // connectionOrPool SIEMPRE estará definido aquí, o es el pool global o una conexión de transacción
            const [rows] = await connectionOrPool.execute(sql, params);
            return rows;
        } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('SQL Error:', { sql, params, message: error.message, stack: error.stack });
            } else {
                console.error('SQL Error:', { message: error.message });
            }
            // Re-lanzar el error para que sea manejado por el controlador
            throw error; 
        }
    },

    /**
     * Obtiene todos los usuarios (solo campos de credenciales)
     */
    async findAll() {
        try {
            // Usa executeQuery sin pasar una conexión, así que usará el Pool global
            return await this.executeQuery(
                `SELECT ${this.userSelectFields} FROM usuarios ORDER BY fecha_creacion DESC`
            );
        } catch (error) {
            console.error('Error en User.findAll:', error);
            throw new Error('Error al obtener usuarios');
        }
    },

    /**
     * Busca un usuario por su ID (sin contraseña, solo campos de credenciales)
     */
    async findById(id) {
        try {
            const rows = await this.executeQuery(
                `SELECT ${this.userSelectFields} FROM usuarios WHERE id = ?`,
                [id]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en User.findById:', error);
            throw new Error('Error al buscar usuario por ID');
        }
    },
    
    /**
     * Busca un usuario por email (sin contraseña)
     */
    async findByEmail(email, connection = null) {
        try {
            // Usa executeQuery, si se le pasa una conexión, la usa (para transacciones), sino usa el pool.
            const rows = await this.executeQuery(
                `SELECT ${this.userSelectFields} FROM usuarios WHERE email = ?`,
                [email],
                connection
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en User.findByEmail:', error);
            throw new Error('Error al buscar usuario por email (sin password)');
        }
    },

    /**
     * Busca un usuario por email para autenticación (incluye password y rol)
     */
    async findByEmailWithPassword(email) {
        try {
            // Usa executeQuery, que obtendrá el Pool global automáticamente
            const rows = await this.executeQuery(
                'SELECT id, email, password, propietarios_cedula, fecha_creacion, fecha_actualizacion FROM usuarios WHERE email = ?',
                [email]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            // Log completo para DEV: incluye email, stack y mensaje original
            if (process.env.NODE_ENV !== 'production') {
                console.error('Error en User.findByEmailWithPassword:', { email, message: error.message, stack: error.stack });
            } else {
                console.error('Error en User.findByEmailWithPassword:', { email, message: error.message });
            }
            // Re-lanzamos el error original para preservar el stack
            throw error;
        }
    },

    /**
     * Crea un nuevo usuario en la base de datos (PARTE DE LA TRANSACCIÓN).
     */
    async create(userData, connection) {
        // Validación de conexión para asegurar el uso en transacciones
        if (!connection) {
            throw new Error('La función User.create debe ejecutarse dentro de una transacción y requiere el objeto de conexión.');
        }

        const { email, password, propietariosCedula } = userData;

        try {
            const [result] = await connection.execute(
                'INSERT INTO usuarios (email, password, propietarios_cedula, fecha_creacion, fecha_actualizacion) VALUES (?, ?, ?, NOW(), NOW())',
                [email, password, propietariosCedula]
            );

            return { insertId: result.insertId };
        } catch (error) {
            console.error('Error en User.create:', error);
            // Manejo de errores específicos de MySQL
            if (error.code === 'ER_DUP_ENTRY') {
                if (error.message.includes('email')) {
                    throw new Error('El email ya está registrado');
                }
                if (error.message.includes('propietarios_cedula')) {
                    throw new Error('La cédula ya está asociada a otra cuenta de usuario.');
                }
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                throw new Error('Error de integridad: La cédula no existe en la tabla de propietarios.');
            }
            throw new Error('Error al crear usuario');
        }
    },

    /**
     * Actualiza un usuario existente (solo credenciales).
     */
    async update(id, userData, connection) {
        // Usa la conexión de la transacción si se proporciona, sino usará el Pool global a través de executeQuery
        
        try {
            const allowedUpdates = {};
            // Campos que pueden ser actualizados
            const availableFields = ['email', 'password', 'propietarios_cedula', 'rol', 'activo']; 
            
            for (const key of availableFields) {
                if (userData[key] !== undefined) {
                    allowedUpdates[key] = userData[key];
                }
            }

            if (Object.keys(allowedUpdates).length === 0) {
                // No hay nada que actualizar, retornamos el usuario actual
                return await this.findById(id);
            }

            let query = 'UPDATE usuarios SET ';
            const params = [];
            const fields = [];

            for (const [key, value] of Object.entries(allowedUpdates)) {
                fields.push(`${key} = ?`);
                params.push(value);
            }

            query += fields.join(', ');
            query += ', fecha_actualizacion = NOW() WHERE id = ?';
            params.push(id);
            
            // Pasamos la conexión o null, para que executeQuery decida usar el pool o la conexión.
            const [result] = await (connection || getDB()).execute(query, params);

            if (result.affectedRows === 0) {
                return null; // Usuario no encontrado
            }

            // Retorna el usuario actualizado
            return await this.findById(id);
        } catch (error) {
            console.error('Error en User.update:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('El email ya está registrado');
            }
            throw new Error('Error al actualizar usuario');
        }
    },

    /**
     * Elimina un usuario por su ID
     */
    async delete(id) {
        try {
            // Obtiene el Pool justo antes de usarlo
            const pool = getDB(); 
            const [result] = await pool.execute(
                'DELETE FROM usuarios WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en User.delete:', error);
            throw new Error('Error al eliminar usuario');
        }
    },

    /**
     * Busca usuarios por una cadena en el email
     */
    async search(query) {
        try {
            const searchQuery = `%${query}%`;
            return await this.executeQuery(
                `SELECT ${this.userSelectFields} FROM usuarios WHERE email LIKE ? ORDER BY fecha_creacion DESC`,
                [searchQuery]
            );
        } catch (error) {
            console.error('Error en User.search:', error);
            throw new Error('Error al buscar usuarios');
        }
    },

    /**
     * Obtiene estadísticas básicas de usuarios
     */
    async getStats() {
        try {
            // Obtiene el Pool justo antes de usarlo
            const pool = getDB();
            const [totalUsers] = await pool.execute('SELECT COUNT(*) AS count FROM usuarios');
            const [latestUser] = await pool.execute(
                `SELECT ${this.userSelectFields} FROM usuarios ORDER BY fecha_creacion DESC LIMIT 1`
            );

            return {
                total: totalUsers[0].count,
                lastRegistered: latestUser.length > 0 ? latestUser[0] : null
            };
        } catch (error) {
            console.error('Error en User.getStats:', error);
            throw new Error('Error al obtener estadísticas de usuarios');
        }
    },

    // Implementa paginación simple (page: 1-based, limit)
    async paginate(page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            const pool = getDB();

            // Asegurar que limit y offset son enteros
            const limitInt = parseInt(limit);
            const offsetInt = parseInt(offset);

            // MySQL no acepta parámetros preparados en LIMIT/OFFSET, usamos query con interpolación segura
            const [rows] = await pool.query(
                `SELECT ${this.userSelectFields} FROM usuarios ORDER BY fecha_creacion DESC LIMIT ${limitInt} OFFSET ${offsetInt}`
            );

            const [countResult] = await pool.query('SELECT COUNT(*) AS count FROM usuarios');
            const count = countResult[0].count;

            const totalPages = Math.ceil(count / limitInt);

            return {
                users: rows,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalUsers: count,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            };
        } catch (error) {
            console.error('Error en User.paginate:', error);
            throw new Error('Error al paginar usuarios');
        }
    },

    // Buscar por nombre completo (intenta JOIN con propietarios si existe, sino busca en email)
    async searchByFullName(query) {
        try {
            const pool = getDB();
            const likeQ = `%${query}%`;
            // Intentar JOIN con propietarios
            try {
                const [rows] = await pool.execute(
                    `SELECT u.id, u.email, u.propietarios_cedula, u.fecha_creacion, u.fecha_actualizacion
                     FROM usuarios u
                     JOIN propietarios p ON p.cedula = u.propietarios_cedula
                     WHERE CONCAT(p.nombre, ' ', p.apellido) LIKE ?
                     ORDER BY u.fecha_creacion DESC`,
                    [likeQ]
                );
                return rows;
            } catch (innerErr) {
                // Si la tabla propietarios no existe, hacemos fallback por email y nombre en usuarios
                console.warn('Fallback en User.searchByFullName (sin tabla propietarios):', innerErr.message);
                const [rows] = await pool.execute(
                    `SELECT ${this.userSelectFields} FROM usuarios WHERE email LIKE ? OR nombre LIKE ? ORDER BY fecha_creacion DESC`,
                    [likeQ, likeQ]
                );
                return rows;
            }
        } catch (error) {
            console.error('Error en User.searchByFullName:', error);
            throw new Error('Error al buscar usuarios por nombre');
        }
    },

    // Cuenta todos los usuarios
    async count() {
        try {
            const pool = getDB();
            const [rows] = await pool.execute('SELECT COUNT(*) AS total FROM usuarios');
            return rows[0].total;
        } catch (error) {
            console.error('Error en User.count:', error);
            throw new Error('Error al contar usuarios');
        }
    }
};

module.exports = User;
