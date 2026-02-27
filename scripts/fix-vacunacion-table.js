const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixTable() {
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

    // Ver estructura actual
    console.log('\n=== ESTRUCTURA ACTUAL ===');
    const [currentStructure] = await connection.query('DESCRIBE vacunacion');
    console.table(currentStructure);

    // Modificar proxima_dosis para permitir NULL
    console.log('\n=== MODIFICANDO proxima_dosis a NULL ===');
    await connection.execute(
      'ALTER TABLE vacunacion MODIFY proxima_dosis VARCHAR(55) NULL'
    );
    console.log('✓ proxima_dosis ahora permite NULL');

    // Modificar fecha_aplicacion a DATE si es necesario
    console.log('\n=== MODIFICANDO fecha_aplicacion a DATE ===');
    await connection.execute(
      'ALTER TABLE vacunacion MODIFY fecha_aplicacion DATE NOT NULL'
    );
    console.log('✓ fecha_aplicacion ahora es DATE');

    // Modificar proxima_dosis a DATE NULL
    console.log('\n=== MODIFICANDO proxima_dosis a DATE NULL ===');
    await connection.execute(
      'ALTER TABLE vacunacion MODIFY proxima_dosis DATE NULL'
    );
    console.log('✓ proxima_dosis ahora es DATE NULL');

    // Ver estructura final
    console.log('\n=== ESTRUCTURA FINAL ===');
    const [finalStructure] = await connection.query('DESCRIBE vacunacion');
    console.table(finalStructure);

  } catch (error) {
    console.error('✗ Error:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixTable();
