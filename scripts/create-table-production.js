const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function createTable() {
  let connection;
  
  try {
    // Conectar a la base de datos de producción
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

    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, 'create-vacunacion-table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Ejecutar el SQL
    console.log('Ejecutando CREATE TABLE...');
    const [result] = await connection.execute(sql);
    console.log('✓ Tabla vacunacion creada exitosamente');

    // Verificar que la tabla existe
    const [tables] = await connection.query("SHOW TABLES LIKE 'vacunacion'");
    if (tables.length > 0) {
      console.log('✓ Tabla verificada en la base de datos');
      
      // Mostrar estructura
      const [columns] = await connection.query("DESCRIBE vacunacion");
      console.log('\nEstructura de la tabla vacunacion:');
      console.table(columns);
    }

  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Conexión cerrada');
    }
  }
}

createTable();
