const { connectDB, getDB } = require('../config/database');

(async () => {
  try {
    await connectDB();
    const pool = getDB();
    const sql = `CREATE TABLE IF NOT EXISTS pacientes (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

    await pool.execute(sql);
    console.log('Tabla `pacientes` creada o ya existente.');
  } catch (err) {
    console.error('Error al crear tabla pacientes:', err);
  } finally {
    process.exit(0);
  }
})();
