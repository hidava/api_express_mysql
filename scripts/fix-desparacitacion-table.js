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
    const [currentStructure] = await connection.query('DESCRIBE desparacitacion');
    console.table(currentStructure);

    // Modificar fecha_aplicada a DATE
    console.log('\n=== MODIFICANDO fecha_aplicada a DATE ===');
    await connection.execute(
      'ALTER TABLE desparacitacion MODIFY fecha_aplicada DATE NOT NULL'
    );
    console.log('✓ fecha_aplicada ahora es DATE NOT NULL');

    // Modificar proxima_dosis a DATE NULL
    console.log('\n=== MODIFICANDO proxima_dosis a DATE NULL ===');
    await connection.execute(
      'ALTER TABLE desparacitacion MODIFY proxima_dosis DATE NULL'
    );
    console.log('✓ proxima_dosis ahora es DATE NULL');

    // Agregar AUTO_INCREMENT al ID
    console.log('\n=== AGREGANDO AUTO_INCREMENT a id_desparacitacion ===');
    await connection.execute(
      'ALTER TABLE desparacitacion MODIFY id_desparacitacion INT AUTO_INCREMENT'
    );
    console.log('✓ AUTO_INCREMENT agregado');

    // Verificar foreign key y agregar si no existe
    console.log('\n=== VERIFICANDO FOREIGN KEY ===');
    const [fks] = await connection.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
        AND TABLE_NAME = 'desparacitacion' 
        AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    `);
    
    if (fks.length === 0) {
      console.log('Agregando foreign key...');
      await connection.execute(`
        ALTER TABLE desparacitacion 
        ADD CONSTRAINT fk_desparacitacion_paciente 
        FOREIGN KEY (pacientes_id_mascota) 
        REFERENCES pacientes(id_mascota) 
        ON DELETE CASCADE
      `);
      console.log('✓ Foreign key agregada');
    } else {
      console.log('✓ Foreign key ya existe');
    }

    // Agregar índices si no existen
    console.log('\n=== VERIFICANDO ÍNDICES ===');
    const [indexes] = await connection.query(`
      SHOW INDEX FROM desparacitacion WHERE Key_name = 'idx_paciente_desp'
    `);
    
    if (indexes.length === 0) {
      await connection.execute(
        'CREATE INDEX idx_paciente_desp ON desparacitacion(pacientes_id_mascota)'
      );
      console.log('✓ Índice idx_paciente_desp creado');
    } else {
      console.log('✓ Índice idx_paciente_desp ya existe');
    }

    // Ver estructura final
    console.log('\n=== ESTRUCTURA FINAL ===');
    const [finalStructure] = await connection.query('DESCRIBE desparacitacion');
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
      console.log('\n✓ Conexión cerrada');
    }
  }
}

fixTable();
