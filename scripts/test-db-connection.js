/**
 * Script de prueba para verificar la conexión a la base de datos
 */

require('dotenv').config();
const { getDB, connectDB } = require('../config/database');

async function testDatabase() {
    try {
        console.log('🔍 Probando conexión a la base de datos...');
        console.log('Configuración:');
        console.log(`- Host: ${process.env.DB_HOST || 'localhost'}`);
        console.log(`- User: ${process.env.DB_USER || 'root'}`);
        console.log(`- Database: ${process.env.DB_NAME || 'usuarios_db'}`);
        console.log(`- Port: ${process.env.DB_PORT || 3306}`);
        console.log('');

        // Probar conexión
        await connectDB();
        console.log('✅ Conexión establecida correctamente');
        
        // Verificar tabla usuarios
        console.log('\n🔍 Verificando tabla usuarios...');
        const pool = getDB();
        
        const [tables] = await pool.query("SHOW TABLES LIKE 'usuarios'");
        if (tables.length === 0) {
            console.log('❌ La tabla "usuarios" no existe');
            console.log('💡 Ejecuta el script SQL en docs/database.sql para crear las tablas');
            process.exit(1);
        }
        console.log('✅ Tabla "usuarios" existe');
        
        // Mostrar estructura de la tabla
        console.log('\n📋 Estructura de la tabla usuarios:');
        const [columns] = await pool.query('DESCRIBE usuarios');
        console.table(columns);
        
        // Contar usuarios
        const [count] = await pool.query('SELECT COUNT(*) as total FROM usuarios');
        console.log(`\n👥 Total de usuarios en la base de datos: ${count[0].total}`);
        
        // Verificar tabla propietarios
        console.log('\n🔍 Verificando tabla propietarios...');
        const [propTables] = await pool.query("SHOW TABLES LIKE 'propietarios'");
        if (propTables.length === 0) {
            console.log('❌ La tabla "propietarios" no existe');
        } else {
            console.log('✅ Tabla "propietarios" existe');
            const [propCount] = await pool.query('SELECT COUNT(*) as total FROM propietarios');
            console.log(`👤 Total de propietarios: ${propCount[0].total}`);
        }
        
        // Probar paginación
        console.log('\n🔍 Probando consulta de paginación...');
        const limit = 10;
        const offset = 0;
        const [users] = await pool.query(
            `SELECT id, email, propietarios_cedula, fecha_creacion FROM usuarios ORDER BY fecha_creacion DESC LIMIT ${limit} OFFSET ${offset}`
        );
        console.log(`✅ Consulta exitosa, se obtuvieron ${users.length} usuarios`);
        if (users.length > 0) {
            console.log('\nPrimer usuario:');
            console.log(users[0]);
        }
        
        console.log('\n✅ Todas las pruebas completadas exitosamente');
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Error en la prueba:', error.message);
        console.error('\nDetalles del error:');
        console.error(error);
        process.exit(1);
    }
}

testDatabase();
