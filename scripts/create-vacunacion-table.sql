-- Crear tabla vacunacion si no existe
CREATE TABLE IF NOT EXISTS vacunacion (
  id_vacunacion INT AUTO_INCREMENT PRIMARY KEY,
  nombre_vacuna VARCHAR(100) NOT NULL,
  fecha_aplicacion DATE NOT NULL,
  proxima_dosis DATE NULL,
  pacientes_id_mascota INT NOT NULL,
  FOREIGN KEY (pacientes_id_mascota) REFERENCES pacientes(id_mascota) ON DELETE CASCADE,
  INDEX idx_paciente (pacientes_id_mascota),
  INDEX idx_fecha (fecha_aplicacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
