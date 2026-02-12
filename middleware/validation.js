const { body, validationResult } = require('express-validator');

// --- 1. DEFINICIONES DE REGLAS DE VALIDACIÓN ---

/**
 * Validación completa para el cuerpo de la solicitud de creación de usuario Admin (ej. POST /users)
 * Incluye campos de Propietario (nombre, apellido, cedula, direccion) y Usuario (email, password)
 */
const validateUser = [
    body('nombre').trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.'),
    body('apellido').trim().isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres.'), // <-- CORREGIDO/AÑADIDO
    body('cedula').trim().isLength({ min: 5, max: 20 }).withMessage('La cédula debe tener entre 5 y 20 dígitos.').isNumeric().withMessage('La cédula debe ser numérica.'), // <-- CORREGIDO/AÑADIDO
    body('direccion').optional().trim().isLength({ min: 5, max: 255 }).withMessage('La dirección debe tener entre 5 y 255 caracteres.'), // <-- CORREGIDO/AÑADIDO
    body('email').trim().isEmail().withMessage('El formato del email no es válido.').normalizeEmail(),
    body('telefono').optional().isMobilePhone('any', { strictMode: false }).withMessage('El número de teléfono no es válido.'),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial.')
];

/**
 * Validación para la ruta de registro (POST /auth/register)
 */
const validateRegister = [
    body('nombre').trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.'),
    body('apellido').trim().isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres.'),
    body('cedula').trim().isLength({ min: 5, max: 20 }).withMessage('La cédula debe tener entre 5 y 20 dígitos.').isNumeric().withMessage('La cédula debe ser numérica.'),
    body('direccion').optional().trim().isLength({ min: 5, max: 255 }).withMessage('La dirección debe tener entre 5 y 255 caracteres.'), // Asegurando que esté aquí
    body('email').trim().isEmail().withMessage('El formato del email no es válido.').normalizeEmail(),
    body('telefono').optional().isMobilePhone('any', { strictMode: false }).withMessage('El número de teléfono no es válido.'),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial.')
];

/**
 * Validación para la ruta de login
 */
const validateLogin = [
    body('email').trim().isEmail().withMessage('El formato del email no es válido.').normalizeEmail(),
    body('password').exists().withMessage('La contraseña es requerida.')
];

/**
 * Validación para la actualización de perfil (PUT /auth/profile)
 * Incluye campos de ambas tablas como opcionales.
 */
const validateProfileUpdate = [
    body('nombre').optional().trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.'),
    body('apellido').optional().trim().isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres.'), // <-- CORREGIDO/AÑADIDO
    body('direccion').optional().trim().isLength({ min: 5, max: 255 }).withMessage('La dirección debe tener entre 5 y 255 caracteres.'), // <-- CORREGIDO/AÑADIDO
    body('email').optional().trim().isEmail().withMessage('El formato del email no es válido.').normalizeEmail(),
    body('telefono').optional().isMobilePhone('any', { strictMode: false }).withMessage('El número de teléfono no es válido.'),
    
    // Si se proporciona newPassword, debe pasar las reglas de complejidad
    body('newPassword').optional().isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres.')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('La nueva contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial.'),
        
    // currentPassword es obligatorio si se intenta cambiar la contraseña
    body('currentPassword').custom((value, { req }) => {
        if (req.body.newPassword && !value) {
            throw new Error('La contraseña actual es requerida para cambiar la contraseña.');
        }
        return true;
    }).optional()
];

/**
 * Validación de parámetros de ruta (para IDs numéricos)
 */
const { param, query } = require('express-validator');

const validateUserId = [
    // Validar req.params.id como entero positivo
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID de usuario debe ser un número entero positivo')
];

/**
 * Validación para parámetros de paginación (ej. query string)
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser un número entero positivo'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('El límite debe ser un número entre 1 y 100')
];

/**
 * Validación para la búsqueda por nombre (ej. en una query string)
 */
const validateSearch = [
    query('q')
        .optional()
        .trim()
        .isLength({ min: 1 }).withMessage('El término de búsqueda debe tener al menos 1 caracter.')
];

/**
 * Validación parcial de usuario (si se usa en alguna otra ruta para actualizar datos personales)
 */
const validateUserPartial = [
    body('nombre').optional().trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.'),
    body('apellido').optional().trim().isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres.'), // <-- CORREGIDO/AÑADIDO
    body('direccion').optional().trim().isLength({ min: 5, max: 255 }).withMessage('La dirección debe tener entre 5 y 255 caracteres.'), // <-- CORREGIDO/AÑADIDO
    body('email').optional().trim().isEmail().withMessage('El formato del email no es válido.').normalizeEmail(),
    body('telefono').optional().isMobilePhone('any', { strictMode: false }).withMessage('El número de teléfono no es válido.')
];

// --- 2. DEFINICIONES DE MIDDLEWARE (Funciones) ---

/**
 * Middleware para sanitizar entradas (simulación, ya que express-validator lo hace)
 */
const sanitizeInput = (req, res, next) => {
    // Aquí puedes añadir sanitización global si es necesario, 
    // pero para este caso, express-validator maneja la mayoría.
    next(); 
};

/**
 * Middleware para manejar errores de JSON mal formado
 */
const validateJSON = (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ success: false, message: 'JSON mal formado en el cuerpo de la solicitud.' });
    }
    next(err);
};

/**
 * Middleware de manejo de errores
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            message: 'Errores de validación',
            errors: errors.array() 
        });
    }
    next();
};

/**
 * Middleware para asegurar que la solicitud es JSON
 */
const validateContentType = (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'DELETE' && 
        req.headers['content-type'] && 
        !req.headers['content-type'].includes('application/json')) {
        return res.status(415).json({ 
            success: false,
            message: 'Tipo de contenido no soportado. Debe ser application/json.'
        });
    }
    next();
};

// --- 3. EXPORTACIÓN FINAL ---

module.exports = {
    validateUser,
    validateRegister, 
    validateLogin,    
    validateProfileUpdate, 
    validateUserId,
    validatePagination,
    validateSearch,
    validateUserPartial,
    sanitizeInput,
    validateJSON,
    handleValidationErrors,
    validateContentType
};