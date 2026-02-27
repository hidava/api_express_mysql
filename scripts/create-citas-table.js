require('dotenv').config();
const mysql = require('mysql2/promise');

async function createCitasTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD || process.env.DB_PASS,
        database: process.env.DB_NAME,
        ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
        } : false
    });

    try {
        console.log('📅 Creando tabla citas...');

        // Verificar estructura de las tablas relacionadas
        console.log('\n🔍 Verificando estructura de las tablas...');
        const [propietariosColumns] = await connection.query('SHOW COLUMNS FROM propietarios;');
        const cedulaColumn = propietariosColumns.find(col => col.Field === 'cedula');
        console.log('Columna cedula en propietarios:', cedulaColumn);

        const [pacientesColumns] = await connection.query('SHOW COLUMNS FROM pacientes;');
        const propCedulaColumn = pacientesColumns.find(col => col.Field === 'propietarios_cedula');
        console.log('Columna propietarios_cedula en pacientes:', propCedulaColumn);

        // Drop table if exists (para testing)
        await connection.query('DROP TABLE IF EXISTS citas;');
        console.log('✓ Tabla anterior eliminada (si existía)');

        // Crear tabla citas - propietarios_cedula debe ser INT como en propietarios
        const createTableSQL = `
            CREATE TABLE citas (
                id_cita INT AUTO_INCREMENT PRIMARY KEY,
                propietarios_cedula INT NOT NULL,
                pacientes_id_mascota INT NOT NULL,
                sede VARCHAR(100) NOT NULL DEFAULT 'Patitas Felices Alajuela',
                fecha_cita DATE NOT NULL,
                hora_cita TIME NOT NULL,
                descripcion TEXT,
                estado ENUM('pendiente', 'confirmada', 'cancelada', 'completada') DEFAULT 'pendiente',
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (propietarios_cedula) REFERENCES propietarios(cedula) ON DELETE CASCADE,
                FOREIGN KEY (pacientes_id_mascota) REFERENCES pacientes(id_mascota) ON DELETE CASCADE,
                INDEX idx_fecha_cita (fecha_cita),
                INDEX idx_propietario (propietarios_cedula),
                INDEX idx_paciente (pacientes_id_mascota),
                INDEX idx_estado (estado)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await connection.query(createTableSQL);
        console.log('✅ Tabla citas creada exitosamente');

        // Verificar estructura
        const [columns] = await connection.query(`
            SHOW COLUMNS FROM citas;
        `);

        console.log('\n📋 Estructura de la tabla citas:');
        columns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
        });

        // Insertar algunas citas de ejemplo (opcional)
        console.log('\n🌱 Insertando datos de ejemplo...');
        
        const ejemploCitas = `
            INSERT INTO citas (propietarios_cedula, pacientes_id_mascota, fecha_cita, hora_cita, descripcion, estado)
            VALUES 
                ('208320615', 3, '2026-03-01', '09:00:00', 'Revisión general y vacunación', 'pendiente'),
                ('208320615', 11, '2026-03-01', '10:00:00', 'Control de peso y consulta', 'pendiente');
        `;

        try {
            await connection.query(ejemploCitas);
            console.log('✅ Datos de ejemplo insertados');
        } catch (error) {
            console.log('⚠️ No se pudieron insertar datos de ejemplo (puede que los IDs no existan):', error.message);
        }

        // Contar citas
        const [count] = await connection.query('SELECT COUNT(*) as total FROM citas;');
        console.log(`\n📊 Total de citas: ${count[0].total}`);

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await connection.end();
        console.log('\n✓ Conexión cerrada');
    }
}

createCitasTable()
    .then(() => {
        console.log('\n🎉 Proceso completado exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Proceso falló:', error);
        process.exit(1);
    });
