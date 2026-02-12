/**
 * Modelo Paciente (DAO)
 * Tabla: pacientes
 */
const { getDB } = require('../config/database');

const Paciente = {
  async create(data, connection = null) {
    const executor = connection || getDB();
    const {
      nombreMascota, nombre, especie, raza, edad, peso, altura, propietarios_cedula
    } = data;

    // Compatibilidad: algunos esquemas usan 'nombre' y otros 'nombreMascota'
    const nombreFinal = nombre || nombreMascota;
    const propietarioCedulaFinal = isNaN(Number(propietarios_cedula)) ? propietarios_cedula : Number(propietarios_cedula);

    try {
      const [result] = await executor.execute(
        `INSERT INTO pacientes (nombre, especie, raza, edad, peso, altura, propietarios_cedula)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nombreFinal, especie, raza, edad, peso, altura, propietarioCedulaFinal]
      );
      return { insertId: result.insertId };
    } catch (error) {
      console.error('Error en Paciente.create:', { message: error.message, stack: error.stack });
      throw error;
    }
  }
};

module.exports = Paciente;
