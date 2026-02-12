/**
 * Rutas de Usuarios
 * @description Define todas las rutas REST para la gestión de usuarios
 */

const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { 
    validateUser, 
    validateUserId, 
    validateUserPartial, // Importación para el PUT/PATCH
    handleValidationErrors
} = require('../middleware/validation');

/**
 * @route GET /users
 * @description Obtiene todos los usuarios con paginación opcional
 * @access Public (Debe estar restringido a Admin en producción)
 * @param {number} [page=1] - Número de página
 * @param {number} [limit=10] - Límite de usuarios por página
 * @param {string} [search] - Término de búsqueda por nombre/apellido
 * @returns {Object} Lista de usuarios con metadatos de paginación
 */
router.get('/', UserController.getAllUsers);

/**
 * @route GET /users/search
 * @description Busca usuarios por nombre/apellido
 * @access Public (Debe estar restringido a Admin en producción)
 * @param {string} q - Término de búsqueda (query parameter)
 * @returns {Object} Lista de usuarios que coinciden con la búsqueda
 */
router.get('/search', UserController.searchUsers);

/**
 * @route GET /users/stats
 * @description Obtiene estadísticas de usuarios
 * @access Public (Debe estar restringido a Admin en producción)
 * @returns {Object} Estadísticas del sistema de usuarios
 */
router.get('/stats', UserController.getUserStats);

/**
 * @route GET /users/:id
 * @description Obtiene un usuario específico por ID (datos combinados)
 * @access Public (Debe estar restringido a Admin en producción)
 * @param {number} id - ID del usuario
 * @returns {Object} Datos del usuario solicitado
 */
router.get('/:id', validateUserId, handleValidationErrors, UserController.getUserById);

/**
 * @route POST /users
 * @description Crea un nuevo usuario (admin, requiere todos los campos)
 * @access Public (Debe estar restringido a Admin en producción)
 * @body {string} nombre - Nombre del propietario (requerido)
 * @body {string} apellido - Apellido del propietario (requerido)
 * @body {string} cedula - Cédula única del propietario (requerido)
 * @body {string} [direccion] - Dirección del propietario (opcional)
 * @body {string} email - Email único del usuario (requerido)
 * @body {string} [telefono] - Número de teléfono del propietario (opcional)
 * @body {string} password - Contraseña del usuario (requerido)
 * @returns {Object} Usuario creado
 */
router.post('/', validateUser, handleValidationErrors, UserController.createUser);

/**
 * @route PUT /users/:id
 * @description Actualiza un usuario existente y sus datos de propietario (parcial)
 * @access Public (Debe estar restringido a Admin en producción)
 * @param {number} id - ID del usuario a actualizar
 * @body {string} [nombre] - Nombre del propietario (opcional)
 * @body {string} [apellido] - Apellido del propietario (opcional)
 * @body {string} [direccion] - Dirección del propietario (opcional)
 * @body {string} [email] - Email único del usuario (opcional)
 * @body {string} [telefono] - Número de teléfono del propietario (opcional)
 * @returns {Object} Usuario actualizado
 */
// Usamos validateUserPartial porque la actualización no requiere todos los campos
router.put('/:id', validateUserId, validateUserPartial, handleValidationErrors, UserController.updateUser); 

/**
 * @route DELETE /users/:id
 * @description Elimina un usuario (y su registro de propietario asociado)
 * @access Public (Debe estar restringido a Admin en producción)
 * @param {number} id - ID del usuario a eliminar
 * @returns {Object} Mensaje de confirmación
 */
router.delete('/:id', validateUserId, handleValidationErrors, UserController.deleteUser);

module.exports = router;
