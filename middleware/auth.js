// middleware/auth.js

/**
 * Middleware de Autenticación JWT
 * @description Middleware para verificar y validar tokens JWT
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware para verificar token JWT
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Obtener el token del header Authorization
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de acceso requerido',
                error: 'No se proporcionó token de autenticación'
            });
        }

        // Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key');
        
        // 💡 CORRECCIÓN CLAVE: 
        // 1. Intentamos obtener el ID con 'id' (más común en MySQL) o 'userId'.
        // 2. Usamos el operador '||' para asegurar que siempre haya un valor (aunque sea null).
        // 3. Si el ID no existe en el token, asumimos que el token fue firmado incorrectamente.
        const userId = decoded.id || decoded.userId; 

        if (!userId) {
            console.error('JWT decodificado no contiene la propiedad "id" o "userId". Objeto:', decoded);
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'El token no contiene un identificador de usuario válido.'
            });
        }

        // Verificar que el usuario aún existe
        // ✅ Usamos la variable 'userId' que ya tiene un valor definido
        const user = await User.findById(userId); 
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'El usuario asociado al token no existe'
            });
        }

        // Agregar información del usuario al request
        // Inyectar propiedades estandarizadas en req.user
        req.user = {
            id: user.id,
            email: user.email,
            rol: user.rol || user.rol || null
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'El token proporcionado no es válido (firma incorrecta)'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado',
                error: 'El token ha expirado, por favor inicia sesión nuevamente'
            });
        }
        
        // 500 error si la BD falla o hay otro problema interno
        console.error('Error interno en authenticateToken:', error);
        return res.status(500).json({
            success: false,
            message: 'Error de autenticación',
            error: 'Error interno del servidor al verificar el usuario: ' + error.message
        });
    }
};
/**
 * Middleware opcional de autenticación
 * No falla si no hay token, pero agrega información del usuario si existe
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return next(); // Continuar sin autenticación
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key');
        const userId = decoded.id || decoded.userId; // ✅ CORRECCIÓN APLICADA AQUÍ TAMBIÉN

        if (!userId) {
            return next(); // Si no hay ID en el token, ignóralo.
        }

        const user = await User.findById(userId);

        if (user) {
            req.user = {
                id: user.id,
                email: user.email,
                rol: user.rol || null
            };
        }

        next();
    } catch (error) {
        // En caso de error, simplemente continuar sin autenticación
        next();
    }
};

// Middleware para autorizar roles (ej. ['admin'])
const authorizeRoles = (allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Autenticación requerida' });
        }
        if (allowedRoles.length === 0) return next();
        const userRole = req.user.rol || req.user.role || null;
        if (!userRole || !allowedRoles.includes(userRole)) {
            return res.status(403).json({ success: false, message: 'No autorizado para esta operación' });
        }
        next();
    };
};

// Middleware para verificar propiedad (que el usuario actúe sobre su propio recurso)
const verifyOwnership = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const resourceId = parseInt(req.params.id, 10);
    if (isNaN(resourceId)) return res.status(400).json({ success: false, message: 'ID inválido' });

    // Permitir si es el dueño o si es admin
    const isOwner = req.user.id === resourceId;
    const isAdmin = req.user.rol === 'admin' || req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
        return res.status(403).json({ success: false, message: 'No tienes permiso para modificar este recurso' });
    }

    next();
};

module.exports = {
    authenticateToken,
    optionalAuth,
    authorizeRoles,
    verifyOwnership
};