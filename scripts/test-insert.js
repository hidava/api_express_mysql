const mysql = require('mysql2/promise');
require('dotenv').config();

async function testInsert() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('✓ Conectado a DigitalOcean MySQL');

    // Probar INSERT
    const testData = {
      nombre_vacuna: 'Rabia',
      fecha_aplicacion: '2026-02-26',
      proxima_dosis: null,
      pacientes_id_mascota: 11
    };

    console.log('\nIntentando INSERT con:', testData);

    const [result] = await connection.execute(
      `INSERT INTO vacunacion (nombre_vacuna, fecha_aplicacion, proxima_dosis, pacientes_id_mascota)
       VALUES (?, ?, ?, ?)`,
      [testData.nombre_vacuna, testData.fecha_aplicacion, testData.proxima_dosis, testData.pacientes_id_mascota]
    );

    console.log('✓ INSERT exitoso. ID insertado:', result.insertId);

    // Verificar que se insertó
    const [rows] = await connection.query('SELECT * FROM vacunacion WHERE id_vacunacion = ?', [result.insertId]);
    console.log('\nRegistro insertado:');
    console.table(rows);

  } catch (error) {
    console.error('✗ Error detallado:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testInsert();
