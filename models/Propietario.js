/**
 * Modelo Propietario (DAO - Data Access Object)
 * @description Maneja las operaciones CRUD para la entidad Propietario (datos personales) y Usuario (autenticación).
 * Propietarios guarda todos los datos personales (cedula, nombre, apellido, telefono, direccion).
 */

// Usamos getDB() para obtener el pool cuando sea necesario
const { getDB } = require('../config/database'); 

const Propietario = {
    
    // =======================================================================
    // MÉTODOS DE LA TABLA 'propietarios' (Datos personales del propietario)
    // =======================================================================
    
    /**
     * Crea un nuevo registro de propietario con todos los datos personales.
     * Esta función debe ser llamada DENTRO de una transacción para asegurar consistencia con la tabla 'usuarios'.
     * @param {Object} propietarioData - Datos del propietario (cedula, nombre, apellido, telefono, direccion)
     * @param {mysql.PoolConnection} connection - Conexión de transacción obligatoria.
     * @returns {Promise<Object>} Datos del propietario insertado.
     */
    async create(propietarioData, connection) {
        if (!connection) {
            throw new Error("Se requiere una conexión de transacción para crear un Propietario.");
        }
        
        const { cedula, nombre, apellido, telefono, direccion } = propietarioData;

        try {
            // La tabla propietarios tiene (cedula, nombre, apellido, telefono, direccion)
            const [result] = await connection.execute(
                'INSERT INTO propietarios (cedula, nombre, apellido, telefono, direccion) VALUES (?, ?, ?, ?, ?)',
                [cedula, nombre, apellido, telefono, direccion]
            );

            // Devolvemos los datos insertados
            return { cedula, nombre, apellido, telefono, direccion };
        } catch (error) {
            console.error('Error en Propietario.create (Tabla propietarios):', error);
            // Re-lanzamos el error para que la transacción se revierta en el controlador
            if (error.code === 'ER_DUP_ENTRY' && error.message.includes('cedula')) {
                throw new Error('La cédula ya está registrada como propietario.');
            }
            throw new Error('Error al crear el registro de propietario');
        }
    },
    
    /**
     * Busca un propietario por cédula para obtener sus datos personales.
     * @param {string} cedula - Cédula/Identificación del propietario.
     * @param {mysql.PoolConnection} [connection] - Conexión opcional.
     * @returns {Promise<Object | null>} Objeto propietario o null.
     */
    async findByCedula(cedula, connection = null) {
        try {
            const executor = connection || getDB();
            const [rows] = await executor.execute(
                'SELECT cedula, nombre, apellido, telefono, direccion FROM propietarios WHERE cedula = ?',
                [cedula]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en Propietario.findByCedula:', error);
            throw new Error('Error al buscar propietario por cédula');
        }
    },

    /**
     * Actualiza los datos personales de un propietario por su cédula.
     * @param {string} cedula - Cédula del propietario.
     * @param {Object} updateData - Datos a actualizar ({nombre, apellido, telefono, direccion}).
     * @param {mysql.PoolConnection} [connection] - Conexión opcional para transacciones.
     */
    async update(cedula, updateData, connection = null) {
        const executor = connection || getDB();
        
        try {
            const allowedFields = ['nombre', 'apellido', 'telefono', 'direccion']; 
            const updates = {};
            
            for (const key of allowedFields) {
                if (updateData[key] !== undefined) {
                    updates[key] = updateData[key];
                }
            }

            if (Object.keys(updates).length === 0) {
                return await this.findByCedula(cedula, executor);
            }

            let query = 'UPDATE propietarios SET ';
            const params = [];
            const fields = [];

            for (const [key, value] of Object.entries(updates)) {
                fields.push(`${key} = ?`);
                params.push(value);
            }

            query += fields.join(', ');
            query += ' WHERE cedula = ?';
            params.push(cedula);
            
            const [result] = await executor.execute(query, params);

            if (result.affectedRows === 0) {
                 // Si no se afectó ninguna fila, puede que el propietario no exista
                 return null;
            }

            // Devolver el propietario actualizado
            return await this.findByCedula(cedula, executor);
        } catch (error) {
            console.error('Error en Propietario.update:', error);
            throw new Error('Error al actualizar datos de propietario');
        }
    },

    /**
     * Elimina un registro de propietario por su cédula.
     */
    async delete(cedula, connection = null) {
        try {
            const executor = connection || getDB();
            const [result] = await executor.execute(
                'DELETE FROM propietarios WHERE cedula = ?',
                [cedula]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en Propietario.delete:', error);
            // Este delete debería ser parte de una transacción con la eliminación del usuario
            throw new Error('Error al eliminar propietario');
        }
    },

    // =======================================================================
    // MÉTODOS DE LA TABLA 'usuarios' (Autenticación)
    // =======================================================================

    UsuarioAuth: {
        /**
         * Busca un registro de usuario (email y password hasheado) por su correo electrónico.
         * Esencial para el proceso de login.
         * @param {string} email - Correo electrónico del usuario.
         * @returns {Promise<Object | null>} Objeto usuario con id, email y password (hash) o null.
         */
        async findByEmail(email) {
            try {
                const pool = getDB();
                const [rows] = await pool.execute( 
                    'SELECT id, email, password, propietarios_cedula, fecha_creacion, fecha_actualizacion FROM usuarios WHERE email = ?',
                    [email]
                );
    
                if (rows.length > 0) {
                    return rows[0];
                }
                return null; // Si no se encuentra, devuelve null
    
            } catch (error) {
                console.error("Error en UsuarioAuth.findByEmail (SQL):", error.message);
                throw new Error("Error al buscar usuario por email para autenticación"); 
            }
        },

        /**
         * Crea el registro de autenticación para un propietario.
         * Debe ser llamada DENTRO de la misma transacción que Propietario.create.
         * @param {Object} userData - Datos de autenticación (email, password hasheado, propietarios_cedula).
         * @param {mysql.PoolConnection} connection - Conexión de transacción obligatoria.
         * @returns {Promise<number>} ID del usuario insertado.
         */
        async create(userData, connection) {
            if (!connection) {
                throw new Error("Se requiere una conexión de transacción para crear un UsuarioAuth.");
            }

            const { email, password, propietarios_cedula } = userData;
            
            try {
                // La tabla usuarios tiene (email, password (hash), propietarios_cedula (FK))
                const [result] = await connection.execute(
                    'INSERT INTO usuarios (email, password, propietarios_cedula, fecha_creacion, fecha_actualizacion) VALUES (?, ?, ?, NOW(), NOW())',
                    [email, password, propietarios_cedula]
                );
                
                return result.insertId;

            } catch (error) {
                console.error("Error en UsuarioAuth.create (Tabla usuarios):", error.message);
                if (error.code === 'ER_DUP_ENTRY' && error.message.includes('email')) {
                    throw new Error('El correo electrónico ya está registrado.');
                }
                throw new Error("Error al guardar el nuevo usuario en la base de datos");
            }
        },

        /**
         * Elimina el registro de autenticación del usuario.
         * @param {string} cedula - Cédula del propietario (la FK).
         */
        async delete(cedula, connection = null) {
            const executor = connection || getDB();
            try {
                const [result] = await executor.execute(
                    'DELETE FROM usuarios WHERE propietarios_cedula = ?',
                    [cedula]
                );
                return result.affectedRows > 0;
            } catch (error) {
                console.error('Error en UsuarioAuth.delete:', error);
                throw new Error('Error al eliminar registro de autenticación del usuario');
            }
        }
    }
};

module.exports = Propietario;
