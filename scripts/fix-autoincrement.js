const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixAutoIncrement() {
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

    // Ver Extra actual del id
    const [current] = await connection.query("SHOW COLUMNS FROM vacunacion WHERE Field = 'id_vacunacion'");
    console.log('\n=== ESTRUCTURA ACTUAL id_vacunacion ===');
    console.table(current);

    // Agregar AUTO_INCREMENT
    console.log('\n=== AGREGANDO AUTO_INCREMENT ===');
    await connection.execute(
      'ALTER TABLE vacunacion MODIFY id_vacunacion INT AUTO_INCREMENT'
    );
    console.log('✓ AUTO_INCREMENT agregado');

    // Verificar
    const [after] = await connection.query("SHOW COLUMNS FROM vacunacion WHERE Field = 'id_vacunacion'");
    console.log('\n=== ESTRUCTURA FINAL id_vacunacion ===');
    console.table(after);

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

fixAutoIncrement();
