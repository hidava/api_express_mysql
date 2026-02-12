/**
 * Rutas de Autenticación
 * @description Define las rutas para login, registro y gestión de perfil.
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 1. Importar los middlewares de validación necesarios
const {
    validateRegister,
    validateLogin,
    validateProfileUpdate,
    handleValidationErrors // Middleware para manejar los resultados de la validación
} = require('../middleware/validation');

// Importa tu middleware de autenticación.
const { authenticateToken } = require('../middleware/auth'); 

// ------------------- Ruta Base -------------------

// GET /api/v1/auth - Información sobre las rutas de autenticación
router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Módulo de Autenticación',
        endpoints: {
            'POST /register': 'Registrar nuevo usuario',
            'POST /login': 'Iniciar sesión',
            'POST /logout': 'Cerrar sesión',
            'POST /verify-token': 'Verificar token (requiere autenticación)',
            'GET /me': 'Obtener perfil del usuario autenticado',
            'PUT /me': 'Actualizar perfil del usuario autenticado'
        }
    });
});

// ------------------- Rutas Públicas -------------------

// POST /api/v1/auth/register - Crear un nuevo usuario y propietario (TRANSACCIÓN)
router.post('/register', 
    validateRegister, 
    handleValidationErrors, 
    authController.register
);

// POST /api/v1/auth/login - Autenticar y obtener token JWT
router.post('/login', 
    validateLogin,
    handleValidationErrors,
    authController.login
);

// POST /api/v1/auth/logout - Cerrar sesión (simple en JWT)
router.post('/logout', authController.logout);


// ------------------- Rutas Privadas (Requieren Token) -------------------

// ✅ NUEVA RUTA: POST /api/v1/auth/verify-token
// Esta es la ruta que tu frontend está buscando.
// Si authenticateToken es exitoso, significa que el token es válido y no expirado.
router.post('/verify-token', 
    authenticateToken, 
    // Si authenticateToken pasa, respondemos 200 OK.
    (req, res) => {
        // No necesitamos lógica compleja. Si llegamos aquí, el token es VÁLIDO.
        res.status(200).send({ message: 'Token válido y activo.' });
    }
);

// GET /api/v1/auth/me - Obtener el perfil del usuario autenticado
router.get('/me', authenticateToken, authController.getMe); 

// PUT /api/v1/auth/me - Actualizar el perfil del usuario
router.put('/me', 
    authenticateToken, 
    validateProfileUpdate, 
    handleValidationErrors, 
    authController.updateProfile
);


module.exports = router;