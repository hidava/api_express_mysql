-- ===================================================================
-- Script de Creación de Base de Datos - Sistema de Usuarios
-- ===================================================================
-- Descripción: Script para crear la base de datos y tabla de usuarios
-- Autor: Tu Nombre
-- Fecha: 2024
-- Versión: 1.0.0
-- ===================================================================

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS usuarios_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE usuarios_db;

-- ===================================================================
-- TABLA: propietarios
-- ===================================================================
-- Descripción: Datos personales de los propietarios (cedula clave primaria)
-- ===================================================================

DROP TABLE IF EXISTS propietarios;

CREATE TABLE propietarios (
    cedula VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(50),
    direccion VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- TABLA: usuarios (referencia a propietarios)
-- ===================================================================
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    propietarios_cedula VARCHAR(50) NOT NULL,
    rol VARCHAR(50) DEFAULT 'user',
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_propietario FOREIGN KEY (propietarios_cedula) REFERENCES propietarios(cedula) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_email (email),
    INDEX idx_fecha_creacion (fecha_creacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ===================================================================
-- Insertar algunos propietarios y usuarios de ejemplo para pruebas
-- ===================================================================

INSERT INTO propietarios (cedula, nombre, apellido, telefono, direccion) VALUES
('V12345678', 'Juan', 'Pérez', '+52 55 1234-5678', 'Ciudad de México'),
('V87654321', 'María', 'García', '+52 55 2345-6789', 'Guadalajara');

INSERT INTO usuarios (email, password, propietarios_cedula) VALUES
('juan.perez@ejemplo.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewmVg7BYMzfpcXSO', 'V12345678'),
('maria.garcia@ejemplo.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewmVg7BYMzfpcXSO', 'V87654321');

-- Tabla pacientes (opcional): mascotas asociadas a un propietario
DROP TABLE IF EXISTS pacientes;
CREATE TABLE pacientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombreMascota VARCHAR(150) NOT NULL,
    especie VARCHAR(50) NOT NULL,
    raza VARCHAR(100) NOT NULL,
    edad INT DEFAULT NULL,
    peso DECIMAL(6,2) DEFAULT NULL,
    altura DECIMAL(6,2) DEFAULT NULL,
    propietarios_cedula VARCHAR(50) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_paciente_propietario FOREIGN KEY (propietarios_cedula) REFERENCES propietarios(cedula) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- PROCEDIMIENTOS ALMACENADOS (OPCIONAL)
-- ===================================================================

-- Procedimiento para obtener estadísticas de usuarios
DELIMITER $$
CREATE PROCEDURE ObtenerEstadisticasUsuarios()
BEGIN
    SELECT 
        COUNT(*) as total_usuarios,
        COUNT(CASE WHEN fecha_creacion >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as usuarios_ultima_semana,
        COUNT(CASE WHEN fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as usuarios_ultimo_mes,
        MIN(fecha_creacion) as primer_registro,
        MAX(fecha_creacion) as ultimo_registro
    FROM usuarios;
END$$
DELIMITER ;

-- Procedimiento para buscar usuarios por patrón de nombre
DELIMITER $$
CREATE PROCEDURE BuscarUsuariosPorNombre(IN patron VARCHAR(100))
BEGIN
    SELECT * FROM usuarios 
    WHERE nombre LIKE CONCAT('%', patron, '%')
    ORDER BY nombre;
END$$
DELIMITER ;

-- ===================================================================
-- VISTAS (OPCIONAL)
-- ===================================================================

-- Vista para mostrar usuarios con información formateada
CREATE VIEW vista_usuarios AS
SELECT 
    id,
    nombre,
    email,
    telefono,
    DATE_FORMAT(fecha_creacion, '%d/%m/%Y %H:%i') as fecha_creacion_formato,
    DATE_FORMAT(fecha_actualizacion, '%d/%m/%Y %H:%i') as fecha_actualizacion_formato,
    DATEDIFF(NOW(), fecha_creacion) as dias_desde_registro
FROM usuarios
ORDER BY fecha_creacion DESC;

-- ===================================================================
-- TRIGGERS (OPCIONAL)
-- ===================================================================

-- Trigger para validar email antes de insertar
DELIMITER $$
CREATE TRIGGER validar_email_insert
BEFORE INSERT ON usuarios
FOR EACH ROW
BEGIN
    -- Validar formato de email básico
    IF NEW.email NOT REGEXP '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,4}$' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Formato de email inválido';
    END IF;
    
    -- Validar que el nombre no esté vacío
    IF TRIM(NEW.nombre) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El nombre no puede estar vacío';
    END IF;
    
    -- Limpiar espacios en blanco
    SET NEW.nombre = TRIM(NEW.nombre);
    SET NEW.email = TRIM(LOWER(NEW.email));
    SET NEW.telefono = TRIM(NEW.telefono);
END$$
DELIMITER ;

-- Trigger para validar email antes de actualizar
DELIMITER $$
CREATE TRIGGER validar_email_update
BEFORE UPDATE ON usuarios
FOR EACH ROW
BEGIN
    -- Validar formato de email básico
    IF NEW.email NOT REGEXP '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,4}$' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Formato de email inválido';
    END IF;
    
    -- Validar que el nombre no esté vacío
    IF TRIM(NEW.nombre) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El nombre no puede estar vacío';
    END IF;
    
    -- Limpiar espacios en blanco
    SET NEW.nombre = TRIM(NEW.nombre);
    SET NEW.email = TRIM(LOWER(NEW.email));
    SET NEW.telefono = TRIM(NEW.telefono);
END$$
DELIMITER ;

-- ===================================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ===================================================================

-- Índice compuesto para búsquedas por nombre y email
CREATE INDEX idx_nombre_email ON usuarios(nombre, email);

-- Índice para ordenar por fecha de actualización
CREATE INDEX idx_fecha_actualizacion ON usuarios(fecha_actualizacion);

-- ===================================================================
-- CONSULTAS DE VERIFICACIÓN
-- ===================================================================

-- Verificar que la tabla se creó correctamente
DESCRIBE usuarios;

-- Mostrar los índices creados
SHOW INDEX FROM usuarios;

-- Contar registros insertados
SELECT COUNT(*) as total_usuarios FROM usuarios;

-- Mostrar algunos registros de ejemplo
SELECT * FROM usuarios LIMIT 5;

-- ===================================================================
-- COMANDOS DE MANTENIMIENTO
-- ===================================================================

-- Para optimizar la tabla (ejecutar periódicamente)
-- OPTIMIZE TABLE usuarios;

-- Para analizar la tabla y actualizar estadísticas
-- ANALYZE TABLE usuarios;

-- Para verificar la integridad de la tabla
-- CHECK TABLE usuarios;

-- Para reparar la tabla si hay problemas
-- REPAIR TABLE usuarios;

-- ===================================================================
-- BACKUP Y RESTAURACIÓN
-- ===================================================================

-- Comando para hacer backup (ejecutar desde terminal):
-- mysqldump -u [usuario] -p usuarios_db > backup_usuarios.sql

-- Comando para restaurar (ejecutar desde terminal):
-- mysql -u [usuario] -p usuarios_db < backup_usuarios.sql

-- ===================================================================
-- NOTAS IMPORTANTES
-- ===================================================================

/*
1. CONFIGURACIÓN DE CARACTERES:
   - Se usa utf8mb4 para soporte completo de Unicode
   - Permite emojis y caracteres especiales

2. MOTOR DE ALMACENAMIENTO:
   - InnoDB para soporte de transacciones y claves foráneas
   - Mejor rendimiento para aplicaciones web

3. CAMPOS DE AUDITORÍA:
   - fecha_creacion: Se establece automáticamente al crear
   - fecha_actualizacion: Se actualiza automáticamente al modificar

4. VALIDACIONES:
   - Email único a nivel de base de datos
   - Triggers para validaciones adicionales
   - Límites de longitud para prevenir ataques

5. ÍNDICES:
   - Optimizan las consultas más comunes
   - email: Para búsquedas y validaciones de unicidad
   - nombre: Para búsquedas por nombre
   - fecha_creacion: Para ordenamiento cronológico

6. PROCEDIMIENTOS ALMACENADOS:
   - Opcional, para operaciones complejas
   - Reducen la carga en la aplicación

7. VISTAS:
   - Opcional, para simplificar consultas complejas
   - Útiles para reportes y análisis

8. TRIGGERS:
   - Opcional, para validaciones automáticas
   - Garantizan la integridad de los datos

RECOMENDACIONES DE SEGURIDAD:
- Usar usuario de BD con permisos limitados
- Encriptar conexiones (SSL/TLS)
- Validar datos también en la aplicación
- Realizar backups regulares
- Monitorear logs de acceso

RENDIMIENTO:
- Los índices mejoran las consultas SELECT
- Pueden ralentizar INSERT/UPDATE
- Monitorear y ajustar según uso real
*/

-- ===================================================================
-- FIN DEL SCRIPT
-- ===================================================================

-- Mostrar mensaje de confirmación
SELECT 'Base de datos y tabla de usuarios creada exitosamente!' as mensaje;