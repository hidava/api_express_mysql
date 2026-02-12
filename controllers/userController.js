/**
 * Controlador de Usuarios
 * @description Maneja las operaciones CRUD para la entidad Usuario, ahora integrando
 * los datos personales de la tabla 'propietarios'.
 */

const User = require('../models/User');
const Propietario = require('../models/Propietario');
const { getConnection } = require('../config/database');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

/**
 * Función auxiliar para combinar datos de usuario (usuarios) y propietario (propietarios)
 * @param {Object} userData - Datos de la tabla 'usuarios'
 * @returns {Promise<Object>} Objeto de usuario combinado
 */
const _combineUserData = async (userData) => {
    if (!userData || !userData.propietarios_cedula) return userData;

    const propietarioData = await Propietario.findByCedula(userData.propietarios_cedula);

    return {
        id: userData.id,
        email: userData.email,
        fecha_creacion: userData.fecha_creacion,
        fecha_actualizacion: userData.fecha_actualizacion,
        // Datos del Propietario
        ...propietarioData 
    };
};

/**
 * Clase que maneja las operaciones del controlador de usuarios
 */
class UserController {
    /**
     * Obtiene todos los usuarios combinando datos de 'usuarios' y 'propietarios'
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     * @returns {Promise<void>}
     */
    static async getAllUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search;

            let result;

            if (search) {
                // Si hay parámetro de búsqueda, buscamos por nombre/apellido en Propietarios
                // NOTA: User.searchByName debe buscar por JOIN o llamar a Propietario.search
                const users = await User.searchByFullName(search); 
                
                // Combinar datos (propietario + usuario)
                const combinedUsers = await Promise.all(users.map(_combineUserData));
                
                result = {
                    users: combinedUsers,
                    pagination: {
                        currentPage: 1,
                        totalPages: 1,
                        totalUsers: combinedUsers.length,
                        hasNextPage: false,
                        hasPrevPage: false
                    }
                };
            } else {
                // Obtener usuarios con paginación
                const { users: rawUsers, pagination } = await User.paginate(page, limit);
                
                // Combinar datos
                const combinedUsers = await Promise.all(rawUsers.map(_combineUserData));
                
                result = { users: combinedUsers, pagination };
            }

            res.status(200).json({
                success: true,
                message: 'Usuarios obtenidos correctamente',
                data: result.users,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Error en getAllUsers:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor (Revisar logs)',
                error: error.message
            });
        }
    }

    /**
     * Obtiene un usuario por su ID (combinando datos)
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     * @returns {Promise<void>}
     */
    static async getUserById(req, res) {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({ success: false, message: 'El ID debe ser un número válido' });
            }

            const userAuthData = await User.findById(id);

            if (!userAuthData) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }

            const user = await _combineUserData(userAuthData);

            res.status(200).json({
                success: true,
                message: 'Usuario obtenido correctamente',
                data: user
            });
        } catch (error) {
            console.error('Error en getUserById:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Crea un nuevo usuario y su registro de propietario (Transacción)
     * Este endpoint no debe usarse para el registro público, sino para la administración.
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     * @returns {Promise<void>}
     */
    static async createUser(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Errores de validación', errors: errors.array() });
        }
        
        // Asumiendo que se envían todos los datos necesarios para ambas tablas
        const { nombre, apellido, cedula, email, telefono, password, direccion } = req.body;
        let connection;

        try {
            connection = await getConnection();
            await connection.beginTransaction();

            // 1. Verificar si la cédula ya existe (como propietario)
            const existingPropietario = await Propietario.findByCedula(cedula, connection);
            if (existingPropietario) {
                await connection.rollback();
                return res.status(409).json({ success: false, message: 'La cédula ya está registrada como propietario.' });
            }

            // 2. Verificar si el email ya existe (como usuario)
            const existingUser = await User.findByEmail(email, connection);
            if (existingUser) {
                await connection.rollback();
                return res.status(409).json({ success: false, message: 'El email ya está registrado.' });
            }

            // 3. Crear Propietario (Datos Personales)
            const hashedPassword = await bcrypt.hash(password || cedula, 10); // Usar cédula como fallback password
            const propietarioData = { nombre, apellido, cedula, telefono, direccion };
            await Propietario.create(propietarioData, connection);

            // 4. Crear Usuario (Credenciales)
            const userData = { email, password: hashedPassword, propietariosCedula: cedula };
            const userResult = await User.create(userData, connection);
            const userId = userResult.insertId;

            await connection.commit();

            const newUser = await _combineUserData({ id: userId, email, propietarios_cedula: cedula });

            res.status(201).json({
                success: true,
                message: 'Usuario y Propietario creados correctamente',
                data: newUser
            });
        } catch (error) {
            if (connection) { await connection.rollback(); }
            console.error('Error en createUser (Transacción):', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        } finally {
            if (connection) { connection.release(); }
        }
    }

    /**
     * Actualiza un usuario existente y su registro de propietario (Transacción)
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     * @returns {Promise<void>}
     */
    static async updateUser(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Errores de validación', errors: errors.array() });
        }

        const { id } = req.params;
        const { nombre, apellido, cedula, email, telefono, direccion } = req.body;
        let connection;

        try {
            connection = await getConnection();
            await connection.beginTransaction();

            // 1. Obtener datos actuales del usuario (incluyendo cédula)
            const existingAuthData = await User.findById(id, connection);
            if (!existingAuthData) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }

            const currentCedula = existingAuthData.propietarios_cedula;

            // 2. Preparar la actualización del Propietario
            const propietarioUpdateData = {};
            if (nombre) propietarioUpdateData.nombre = nombre;
            if (apellido) propietarioUpdateData.apellido = apellido;
            if (telefono) propietarioUpdateData.telefono = telefono;
            if (direccion) propietarioUpdateData.direccion = direccion;
            // NOTA: La cédula no se cambia aquí, solo se actualiza si fuera necesario migrar el registro de propietario

            if (Object.keys(propietarioUpdateData).length > 0) {
                await Propietario.update(currentCedula, propietarioUpdateData, connection);
            }

            // 3. Preparar la actualización del Usuario
            const userUpdateData = {};
            if (email) userUpdateData.email = email;
            // Nota: Aquí se podría manejar el cambio de password si se incluyera en el body.

            if (Object.keys(userUpdateData).length > 0) {
                 // Verificar email duplicado (si se está cambiando)
                if (email && email !== existingAuthData.email) {
                    const emailCheck = await User.findByEmail(email, connection);
                    if (emailCheck && emailCheck.id !== parseInt(id)) {
                        await connection.rollback();
                        return res.status(409).json({ success: false, message: 'El email ya está registrado en otro usuario' });
                    }
                }
                await User.update(id, userUpdateData, connection);
            }

            await connection.commit();

            // 4. Devolver usuario combinado
            const updatedUserAuthData = await User.findById(id);
            const updatedUser = await _combineUserData(updatedUserAuthData);
            
            res.status(200).json({
                success: true,
                message: 'Usuario actualizado correctamente',
                data: updatedUser
            });
        } catch (error) {
            if (connection) { await connection.rollback(); }
            console.error('Error en updateUser (Transacción):', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        } finally {
            if (connection) { connection.release(); }
        }
    }

    /**
     * Elimina un usuario (en ambas tablas) (Transacción)
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     * @returns {Promise<void>}
     */
    static async deleteUser(req, res) {
        const { id } = req.params;
        let connection;

        try {
            if (isNaN(id)) { return res.status(400).json({ success: false, message: 'El ID debe ser un número válido' }); }

            connection = await getConnection();
            await connection.beginTransaction();

            // 1. Obtener la cédula antes de eliminar el usuario
            const existingAuthData = await User.findById(id, connection);
            if (!existingAuthData) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }
            const cedulaToDelete = existingAuthData.propietarios_cedula;

            // 2. Eliminar el registro en 'usuarios'
            await User.delete(id, connection);

            // 3. Eliminar el registro en 'propietarios'
            // Esto es necesario porque la clave foránea no necesariamente elimina en cascada.
            const deleteCount = await Propietario.delete(cedulaToDelete, connection);
            
            if (deleteCount === 0) {
                 console.warn(`No se encontró registro de propietario con cédula ${cedulaToDelete} para eliminar.`);
            }

            await connection.commit();

            res.status(200).json({
                success: true,
                message: 'Usuario y Propietario eliminados correctamente'
            });
        } catch (error) {
            if (connection) { await connection.rollback(); }
            console.error('Error en deleteUser (Transacción):', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        } finally {
            if (connection) { connection.release(); }
        }
    }
    
    // --- Métodos de Búsqueda y Estadísticas (Ajustados) ---

    /**
     * Busca usuarios por nombre (ajustado para la nueva lógica)
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     * @returns {Promise<void>}
     */
    static async searchUsers(req, res) {
        try {
            const { q } = req.query;

            if (!q || q.trim().length === 0) {
                return res.status(400).json({ success: false, message: 'El parámetro de búsqueda es requerido' });
            }

            // User.searchByFullName debe realizar un JOIN entre usuarios y propietarios
            const users = await User.searchByFullName(q.trim()); 
            
            const combinedUsers = await Promise.all(users.map(_combineUserData));

            res.status(200).json({
                success: true,
                message: 'Búsqueda completada',
                data: combinedUsers,
                count: combinedUsers.length
            });
        } catch (error) {
            console.error('Error en searchUsers:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    /**
     * Obtiene estadísticas de usuarios
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     * @returns {Promise<void>}
     */
    static async getUserStats(req, res) {
        try {
            const total = await User.count(); // Cuenta solo los registros en la tabla 'usuarios'

            res.status(200).json({
                success: true,
                message: 'Estadísticas obtenidas correctamente',
                data: {
                    totalUsers: total,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error en getUserStats:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
        }
    }
}

module.exports = UserController;