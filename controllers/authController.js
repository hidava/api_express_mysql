/**
 * Controlador para la Autenticación (Login, Register, Logout)
 * @description Maneja la lógica de negocio para la autenticación de usuarios.
 * Implementa la lógica de la TRANSACCIÓN para el registro.
 */
const Propietario = require('../models/Propietario');
const User = require('../models/User');
const { getConnection } = require('../config/database');
const bcrypt = require('bcryptjs'); // Usado para el hashing de contraseñas
const jwt = require('jsonwebtoken'); // Usado para la generación de tokens JWT

// Clave secreta para JWT (debería venir de process.env.JWT_SECRET)
const JWT_SECRET = process.env.JWT_SECRET || 'mi-clave-ultra-secreta';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1d';

/**
 * * =================================================================================
 * FUNCIONES PRIVADAS (Auxiliares)
 * =================================================================================
 * */

/**
 * Genera un token JWT para un usuario
 * @param {Object} user - Objeto usuario (debe tener al menos id y email)
 * @returns {string} Token JWT
 */
const generateToken = (user) => {
    // El payload del token contiene información mínima para identificar al usuario
    const payload = {
        id: user.id,
        email: user.email,
        propietarioId: user.propietarios_cedula
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

/**
 * * =================================================================================
 * FUNCIONES PÚBLICAS (Manejadores de Rutas)
 * =================================================================================
 * */

/**
 * @route POST /api/v1/auth/register
 * @description Registra un nuevo propietario y su cuenta de usuario en una transacción.
 * @access Public
 */
exports.register = async (req, res) => {
    // 1. Desestructuración y Hashing
    const {
        nombre, apellido, cedula, direccion, // Datos de Propietario (Añadida 'direccion' para limpieza)
        email, telefono, password // Datos de Usuario (se usa cedula como FK)
    } = req.body;

    let connection;

    try {
        // 1. Hashing de la contraseña antes de iniciar la transacción
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Iniciar Transacción
        connection = await getConnection(); // Obtenemos una conexión exclusiva del pool
        await connection.beginTransaction();

        // ===================================================================
        // 3. Inserción del Propietario
        // ===================================================================
        const propietarioData = {
            cedula: cedula,
            nombre: nombre,
            apellido: apellido,
            telefono: telefono,
            direccion: direccion || 'N/A' // Si es opcional, usar 'N/A' como fallback si no viene
        };

        // Primera inserción (Propietario)
        await Propietario.create(propietarioData, connection);


        // ===================================================================
        // 4. Inserción del Usuario
        // ===================================================================
        const userData = {
            email: email,
            password: hashedPassword,
            propietariosCedula: cedula // Clave foránea
        };

        // Segunda inserción (Usuario)
        const userResult = await User.create(userData, connection);

        // 5. Commit de la Transacción
        await connection.commit();

        // 6. Generar respuesta de éxito
        res.status(201).json({
            success: true,
            message: 'Registro exitoso. Propietario y usuario creados.',
            data: {
                email: email,
                cedula: cedula,
                userId: userResult.insertId
            }
        });

    } catch (error) {
        // 7. Manejo de Errores y Rollback
        if (connection) {
            await connection.rollback();
        }

        console.error('❌ Error al registrar usuario (Transacción revertida):', error.message);

        let statusCode = 500;
        let errorMessage = 'Error en el servidor al intentar registrar el usuario.';

        // Manejo de errores de negocio definidos en los modelos
        if (error.message.includes('email ya está registrado')) {
            statusCode = 409;
            errorMessage = 'El correo electrónico ya está asociado a otra cuenta.';
        } else if (error.message.includes('cédula ya está registrada')) {
            statusCode = 409;
            errorMessage = 'La cédula ya existe como registro de propietario.';
        } else if (error.message.includes('cédula ya está asociada')) {
            statusCode = 409;
            errorMessage = 'La cédula ya está asociada a una cuenta de usuario.';
        }

        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: error.message
        });

    } finally {
        // 8. Liberar la conexión
        if (connection) {
            connection.release();
        }
    }
};

/**
 * @route POST /api/v1/auth/login
 * @description Autentica a un usuario y genera un token JWT.
 * @access Public
 */
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Buscar usuario por email, incluyendo la contraseña hasheada
        const userCredentials = await User.findByEmailWithPassword(email);

        if (!userCredentials) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas: Email no encontrado.'
            });
        }

        // 2. Comparar contraseñas
        const isMatch = await bcrypt.compare(password, userCredentials.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas: Contraseña incorrecta.'
            });
        }

        // --- PASO AÑADIDO: OBTENER DATOS PERSONALES DEL PROPIETARIO ---
        const cedula = userCredentials.propietarios_cedula;

        // 3. Buscar los datos personales del propietario
        const ownerData = await Propietario.findByCedula(cedula);

        if (!ownerData) {
            console.error(`⚠️ Propietario con Cédula ${cedula} no existe, a pesar de tener cuenta de usuario.`);
            // Si no hay datos personales, fallamos para evitar un dashboard roto
            return res.status(500).json({
                success: false,
                message: 'Error de integridad: El usuario tiene credenciales, pero faltan sus datos personales de Propietario.'
            });
        }
        // ----------------------------------------------------------------------


        // 4. Generar token JWT
        const token = generateToken(userCredentials);

        // 5. Armar el objeto de usuario completo para el frontend
        const profile = {
            id: userCredentials.id,
            email: userCredentials.email,
            cedula: ownerData.cedula,
            nombre: ownerData.nombre, // <-- Campo solicitado
            apellido: ownerData.apellido, // <-- Campo solicitado
            telefono: ownerData.telefono,
            direccion: ownerData.direccion,
        };

        console.log('✅ Login Exitoso. Enviando token y perfil al cliente.');


        // 6. Respuesta de éxito (SE AJUSTA LA ESTRUCTURA DE LA RESPUESTA)
        res.status(200).json({
            success: true,
            message: 'Login exitoso.',
            token: token, // Mover token al nivel principal
            user: profile // Mover user/profile al nivel principal
        });

    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('❌ Error no controlado en login:', { message: error.message, stack: error.stack });
        } else {
            console.error('❌ Error no controlado en login:', { message: error.message });
        }

        // Aseguramos que siempre haya una respuesta si no se envió una antes
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Error en el servidor durante el login. Verifique logs del backend para más detalles.'
            });
        }
    }
};

/**
 * @route POST /api/v1/auth/logout
 * @description Simplemente responde que el logout fue exitoso (en JWT el token se invalida del lado del cliente).
 * @access Private
 */
exports.logout = (req, res) => {
    // Si usáramos tokens revocables o sesiones, aquí haríamos la lógica de invalidación.
    // Con JWT simple, el cliente simplemente elimina el token.
    res.status(200).json({
        success: true,
        message: 'Sesión cerrada exitosamente.'
    });
};

/**
 * @route GET /api/v1/auth/me
 * @description Obtiene los datos del usuario autenticado (requiere token JWT).
 * @access Private (Requiere middleware de autenticación)
 */
exports.getMe = async (req, res) => {
    try {
        // El middleware de autenticación (ej. authMiddleware) ha inyectado el user ID en req.user
        const userId = req.user.id;

        // 1. Buscar solo los datos de credenciales del usuario
        const userCredentials = await User.findById(userId);

        if (!userCredentials) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        const cedula = userCredentials.propietarios_cedula;

        // 2. Buscar los datos personales del propietario usando la cédula (FK)
        const ownerData = await Propietario.findByCedula(cedula);

        if (!ownerData) {
            // Caso raro donde hay credenciales pero no datos personales
            console.warn(`Usuario ID ${userId} encontrado, pero Propietario con Cédula ${cedula} no existe.`);
            return res.status(404).json({ success: false, message: 'Datos personales no encontrados.' });
        }

        // 3. Combinar datos
        const profile = {
            // Datos de usuario
            id: userCredentials.id,
            email: userCredentials.email,
            // Datos de propietario
            cedula: ownerData.cedula,
            nombre: ownerData.nombre,
            apellido: ownerData.apellido,
            telefono: ownerData.telefono,
            direccion: ownerData.direccion,
            // Fechas
            fecha_creacion: userCredentials.fecha_creacion,
            fecha_actualizacion: userCredentials.fecha_actualizacion
        };

        res.status(200).json({
            success: true,
            message: 'Perfil de usuario obtenido exitosamente.',
            data: profile
        });

    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al obtener el perfil.',
            error: error.message
        });
    }
};

/**
 * @route PUT /api/v1/auth/me
 * @description Actualiza el perfil del usuario (credenciales y datos personales).
 * @access Private (Requiere token JWT)
 */
exports.updateProfile = async (req, res) => {
    const userId = req.user.id; // ID inyectado por el middleware de autenticación

    // CORRECCIÓN DE CONSISTENCIA Y SEGURIDAD: Usar newPassword y currentPassword
    const {
        email, nombre, apellido, telefono, direccion,
        newPassword, currentPassword
    } = req.body;

    let connection;

    try {
        // 1. Obtener la cédula y la contraseña actual (PARA VERIFICACIÓN)
        // Usamos findByEmailWithPassword para traer el hash de la contraseña actual
        const currentUser = await User.findByEmailWithPassword(req.user.email);

        if (!currentUser || currentUser.id !== userId) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado o no autorizado.' });
        }
        const cedula = currentUser.propietarios_cedula;

        // 2. Verificar contraseña actual si se intenta cambiar la contraseña
        const userUpdateData = {};
        if (newPassword) {
            // La validación de existencia ya la hizo validation.js, pero verificamos la corrección

            // Comparar la contraseña actual proporcionada con la almacenada
            const isMatch = await bcrypt.compare(currentPassword, currentUser.password);

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Contraseña actual incorrecta.'
                });
            }

            // Si coincide, hashear la nueva contraseña para la actualización
            userUpdateData.password = await bcrypt.hash(newPassword, 10);
        }

        // 3. Iniciar Transacción
        connection = await getConnection();
        await connection.beginTransaction();

        // 4. Actualizar datos de Propietario (Datos personales)
        const ownerUpdateData = { nombre, apellido, telefono, direccion };
        // Filtrar campos undefined para no intentar actualizar con valor nulo
        Object.keys(ownerUpdateData).forEach(key => ownerUpdateData[key] === undefined && delete ownerUpdateData[key]);

        if (Object.keys(ownerUpdateData).length > 0) {
            // Asume que Propietario.update puede recibir un objeto parcial
            await Propietario.update(cedula, ownerUpdateData, connection);
        }


        // 5. Actualizar datos de Usuario (Credenciales)
        if (email) {
            // Verificar email duplicado (si se está cambiando)
            if (email !== currentUser.email) {
                const emailCheck = await User.findByEmail(email, connection);
                if (emailCheck && emailCheck.id !== userId) {
                    await connection.rollback();
                    return res.status(409).json({ success: false, message: 'El email ya está registrado en otro usuario' });
                }
            }
            userUpdateData.email = email;
        }

        if (Object.keys(userUpdateData).length > 0) {
            await User.update(userId, userUpdateData, connection);
        }


        // 6. Commit de la Transacción
        await connection.commit();

        // 7. Obtener el perfil actualizado para la respuesta
        const updatedUser = await User.findById(userId);
        const updatedOwner = await Propietario.findByCedula(updatedUser.propietarios_cedula);

        const profile = {
            id: updatedUser.id,
            email: updatedUser.email,
            cedula: updatedOwner.cedula,
            nombre: updatedOwner.nombre,
            apellido: updatedOwner.apellido,
            telefono: updatedOwner.telefono,
            direccion: updatedOwner.direccion,
            fecha_creacion: updatedUser.fecha_creacion,
            fecha_actualizacion: updatedUser.fecha_actualizacion
        };


        res.status(200).json({
            success: true,
            message: 'Perfil actualizado exitosamente.',
            data: profile
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error('❌ Error al actualizar perfil (Transacción revertida):', error.message);

        let statusCode = 500;
        let errorMessage = 'Error en el servidor al actualizar el perfil.';

        if (error.message.includes('email ya está registrado')) {
            statusCode = 409;
            errorMessage = 'El correo electrónico ya está registrado por otro usuario.';
        }

        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: error.message
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

