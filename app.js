/**
 * Aplicación Express con MySQL - CRUD de Usuarios
 * @description API REST para gestión de usuarios con base de datos MySQL
 * @author Tu Nombre
 * @version 1.0.1
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();
let helmet;
let rateLimit;
let morgan;
try {
    helmet = require('helmet');
} catch (err) {
    console.warn('Optional dependency "helmet" no está instalada. Ejecuta `npm install` para instalarla.');
}
try {
    rateLimit = require('express-rate-limit');
} catch (err) {
    console.warn('Optional dependency "express-rate-limit" no está instalada. Ejecuta `npm install` para instalarla.');
}
try {
    morgan = require('morgan');
} catch (err) {
    console.warn('Optional dependency "morgan" no está instalada. Ejecuta `npm install` para instalarla.');
}

// Importar configuraciones y utilidades
// Importamos connectDB (para inicializar al inicio) y getDB (para el Health Check)
const { connectDB, getDB } = require('./config/database');

// Importar middlewares de validación
const {
    validateJSON,
    sanitizeInput,
    validateContentType
} = require('./middleware/validation');

// Importar rutas
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const propietariosRoutes = require('./routes/propietariosRoutes');
const pacientesRoutes = require('./routes/pacientesRoutes');
const historialMedicoRoutes = require('./routes/historialMedicoRoutes');
const vacunacionRoutes = require('./routes/vacunacionRoutes');

// Crear aplicación Express
const app = express();

// Configuración del puerto
const PORT = process.env.PORT || 3000;
// Usamos el API_PREFIX del .env. Si no está, por defecto es '/api/v1'
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

/**
 * CONFIGURACIÓN DE MIDDLEWARES (PRE-RUTAS)
 */

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para CORS
const FRONTEND_URLS = '*';

app.use(cors({
    origin: FRONTEND_URLS,
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Seguridad básica y limitador de peticiones (si están instalados)
if (helmet) app.use(helmet());
if (rateLimit) {
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX, 10) : 100,
        standardHeaders: true,
        legacyHeaders: false
    });
    app.use(limiter);
}

// Logging de requests (si está instalado)
if (morgan) {
    if (process.env.NODE_ENV !== 'production') {
        app.use(morgan('dev'));
    } else {
        app.use(morgan('combined'));
    }
}

// Middlewares personalizados
app.use(validateContentType);
app.use(sanitizeInput);

// Middleware para logging de requests (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
        next();
    });
}

/**
 * CONFIGURACIÓN DE RUTAS
 */

// Ruta de health check base
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API de Usuarios funcionando correctamente',
        version: '1.0.1',
        timestamp: new Date().toISOString(),
        endpoints: {
            users: `${API_PREFIX}/users`,
            auth: `${API_PREFIX}/auth`,
            health: '/health',
            docs: '/docs'
        }
    });
});

// Ruta de health check para monitoreo de servicios
app.get('/health', async (req, res) => {
    let dbStatus = 'unhealthy';
    let dbError = null;

    try {
        // USAR getDB() para obtener el pool e intentar una consulta
        const pool = getDB();
        await pool.query('SELECT 1 + 1 AS solution');
        dbStatus = 'connected';
    } catch (error) {
        // Si hay un error, el pool no está funcionando correctamente
        dbError = error.message;
        dbStatus = 'disconnected';
        console.error('Error en Health Check de DB:', error.message);
        return res.status(503).json({
            success: false,
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            services: {
                database: dbStatus,
                server: 'running'
            },
            error: dbError
        });
    }

    // Si llegamos aquí, todo está bien
    res.status(200).json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            database: dbStatus,
            server: 'running'
        }
    });
});

// **********************************************
// ********* MONTAJE DE ROUTERS *****************
// **********************************************

// Creamos un router específico para manejar todas las rutas bajo /api/v1
const apiRouter = express.Router();

// 1. Ruta base GET del API_PREFIX
apiRouter.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Bienvenido a la API v1.0',
        availableModules: {
            auth: `/auth`,
            users: `/users`,
            propietarios: `/propietarios`,
            pacientes: `/pacientes`,
            historialMedico: `/historial-medico`,
            vacunacion: `/vacunacion`
        },
        documentation: '/docs'
    });
});

// 2. Montar sub-routers dentro del apiRouter
apiRouter.use('/users', userRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/propietarios', propietariosRoutes);
apiRouter.use('/pacientes', pacientesRoutes);
apiRouter.use('/historial-medico', historialMedicoRoutes);
apiRouter.use('/vacunacion', vacunacionRoutes);


// 3. Montar el apiRouter en el prefijo principal
app.use(API_PREFIX, apiRouter);

// **********************************************

// Ruta para documentación básica
app.get('/docs', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Documentación de la API',
        baseUrl: `${req.protocol}://${req.get('host')}${API_PREFIX}`,
        endpoints: {
            'POST /auth/register': 'Registrar nuevo usuario',
            'POST /auth/login': 'Iniciar sesión',
            'GET /auth/me': 'Obtener perfil (requiere token)',
            'PUT /auth/me': 'Actualizar perfil (requiere token)',
            'POST /auth/logout': 'Cerrar sesión',
            'GET /users': 'Obtener todos los usuarios (con paginación)',
            'GET /users/:id': 'Obtener usuario por ID',
            'POST /users': 'Crear nuevo usuario',
            'PUT /users/:id': 'Actualizar usuario',
            'DELETE /users/:id': 'Eliminar usuario'
        },
        examples: {
            register: {
                nombre: 'Juan Pérez',
                email: 'juan@ejemplo.com',
                telefono: '+1234567890',
                password: 'MiPassword123!'
            },
        }
    });
});

/**
 * MANEJO DE ERRORES (Importante: debe ir después de todas las rutas)
 */

// Middleware para manejar errores de JSON mal formado (4 argumentos)
app.use(validateJSON);

// Middleware para rutas no encontradas (404)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        requestedUrl: req.originalUrl,
        availableEndpoints: {
            health: '/health',
            docs: '/docs',
            auth: `${API_PREFIX}/auth`,
            users: `${API_PREFIX}/users`
        }
    });
});

// Middleware global de manejo de errores (Captura errores pasados con next(err))
app.use((err, req, res, next) => {
    console.error('Error global:', err);

    // Error de JSON malformado (atrapado por express.json)
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            message: 'JSON mal formado',
            error: 'La estructura del JSON enviado no es válida'
        });
    }

    // Error de payload muy grande
    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            message: 'Payload demasiado grande',
            error: 'El tamaño de los datos enviados excede el límite permitido'
        });
    }

    // Error genérico del servidor
    res.status(err.status || 500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'production'
            ? 'Algo salió mal en el servidor'
            : err.message,
        timestamp: new Date().toISOString()
    });
});

/**
 * INICIALIZACIÓN DEL SERVIDOR
 */

// Función para inicializar la aplicación
const initializeApp = async () => {
    try {
        console.log('🔍 Verificando conexión a la base de datos...');
        // Esta es la función que ahora existe en config/database.js para inicializar el pool
        await connectDB();

        // Iniciar servidor
        const server = app.listen(PORT, () => {
            console.log('🚀 Servidor iniciado correctamente');
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log(`📋 API Base: http://localhost:${PORT}${API_PREFIX}`);
            console.log(`📖 Documentación: http://localhost:${PORT}/docs`);
            console.log(`💚 Health Check: http://localhost:${PORT}/health`);
            console.log(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
        });

        // Manejo graceful de cierre del servidor (SIGTERM y SIGINT)
        process.on('SIGTERM', () => {
            console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
            server.close(() => {
                console.log('✅ Servidor cerrado correctamente');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            console.log('🛑 Recibida señal SIGINT (Ctrl+C), cerrando servidor...');
            server.close(() => {
                console.log('✅ Servidor cerrado correctamente');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ Error al inicializar la aplicación:', error.message);
        // Terminar el proceso si la conexión a la DB falla al inicio
        process.exit(1);
    }
};

// Inicializar aplicación
// En Vercel (serverless): no llamar a app.listen(), solo exportar app
// En local: llamar a app.listen()
if (process.env.VERCEL) {
    // En Vercel: solo exportar sin iniciar listener
    console.log('✅ App se ejecuta como serverless en Vercel');
    module.exports = app;
} else if (require.main === module) {
    // En local o ejecución directa: iniciar servidor
    initializeApp();
    module.exports = app;
} else {
    // En otros casos (importación): solo exportar
    module.exports = app;
}
