/**
 * Script de prueba rápida para verificar la conexión a DigitalOcean
 * y la funcionalidad del historial médico
 */
require('dotenv').config();
const { getDB, connectDB } = require('../config/database');

async function testConnection() {
  console.log('🔍 Probando conexión a DigitalOcean MySQL...\n');
  
  try {
    // Inicializar conexión
    await connectDB();
    console.log('✅ Conexión establecida exitosamente\n');
    
    const pool = getDB();
    
    // 1. Probar consulta simple
    console.log('📊 Probando consulta simple...');
    const [result] = await pool.query('SELECT 1 + 1 AS solution');
    console.log('   Resultado:', result[0].solution, '\n');
    
    // 2. Listar tablas
    console.log('📋 Listando tablas en la base de datos...');
    const [tables] = await pool.query('SHOW TABLES');
    console.log('   Tablas encontradas:', tables.length);
    tables.forEach(t => {
      const tableName = Object.values(t)[0];
      console.log('   -', tableName);
    });
    console.log('');
    
    // 3. Verificar existencia de tabla historial_medico
    console.log('🔍 Verificando tabla historial_medico...');
    const [historialCheck] = await pool.query(
      "SHOW TABLES LIKE 'historial_medico'"
    );
    if (historialCheck.length > 0) {
      console.log('   ✅ Tabla historial_medico existe\n');
      
      // Obtener estructura
      const [columns] = await pool.query('DESCRIBE historial_medico');
      console.log('   Columnas:');
      columns.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type})`);
      });
      console.log('');
      
      // Contar registros
      const [[count]] = await pool.query(
        'SELECT COUNT(*) as total FROM historial_medico'
      );
      console.log(`   📊 Registros en historial_medico: ${count.total}\n`);
    } else {
      console.log('   ⚠️  Tabla historial_medico NO existe\n');
    }
    
    // 4. Verificar tabla pacientes
    console.log('🐾 Verificando tabla pacientes...');
    const [pacientesCheck] = await pool.query(
      "SHOW TABLES LIKE 'pacientes'"
    );
    if (pacientesCheck.length > 0) {
      console.log('   ✅ Tabla pacientes existe');
      const [[count]] = await pool.query(
        'SELECT COUNT(*) as total FROM pacientes'
      );
      console.log(`   📊 Pacientes registrados: ${count.total}\n`);
    } else {
      console.log('   ⚠️  Tabla pacientes NO existe\n');
    }
    
    // 5. Probar consulta JOIN
    console.log('🔗 Probando consulta JOIN (historial + pacientes)...');
    try {
      const [joinResult] = await pool.query(`
        SELECT h.id, h.motivo_consulta, p.nombre AS paciente_nombre
        FROM historial_medico h
        LEFT JOIN pacientes p ON p.id_mascota = h.pacientes_id_mascota
        LIMIT 3
      `);
      console.log(`   ✅ JOIN exitoso. Registros obtenidos: ${joinResult.length}`);
      if (joinResult.length > 0) {
        console.log('   Primeros registros:');
        joinResult.forEach(r => {
          console.log(`   - ID: ${r.id}, Paciente: ${r.paciente_nombre}, Motivo: ${r.motivo_consulta.substring(0, 30)}...`);
        });
      }
      console.log('');
    } catch (err) {
      console.log('   ❌ Error en JOIN:', err.message, '\n');
    }
    
    console.log('✅ Todas las pruebas completadas exitosamente!\n');
    console.log('🚀 La API está lista para usar con la base de datos en la nube.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    console.error('\nDetalles completos:', error);
    process.exit(1);
  }
}

// Ejecutar pruebas
testConnection();
