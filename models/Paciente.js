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
  },

  /**
   * Obtiene todos los pacientes.
   * @returns {Promise<Array>} Array de pacientes.
   */
  async findAll(connection = null) {
    try {
      const executor = connection || getDB();
      const [rows] = await executor.execute(
        'SELECT id_mascota, nombre, especie, raza, edad, peso, altura, propietarios_cedula FROM pacientes ORDER BY nombre ASC'
      );
      return rows;
    } catch (error) {
      console.error('Error en Paciente.findAll:', error);
      throw error;
    }
  },

  /**
   * Obtiene un paciente por su ID.
   * @param {number} id - ID del paciente.
   * @returns {Promise<Object | null>} Objeto paciente o null.
   */
  async findById(id, connection = null) {
    try {
      const executor = connection || getDB();
      const [rows] = await executor.execute(
        'SELECT id_mascota, nombre, especie, raza, edad, peso, altura, propietarios_cedula FROM pacientes WHERE id_mascota = ?',
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error en Paciente.findById:', error);
      throw error;
    }
  },

  /**
   * Obtiene todos los pacientes de un propietario.
   * @param {string} cedula - Cédula del propietario.
   * @returns {Promise<Array>} Array de pacientes del propietario.
   */
  async findByOwner(cedula, connection = null) {
    try {
      const executor = connection || getDB();
      const [rows] = await executor.execute(
        'SELECT id_mascota, nombre, especie, raza, edad, peso, altura, propietarios_cedula FROM pacientes WHERE propietarios_cedula = ? ORDER BY nombre ASC',
        [cedula]
      );
      return rows;
    } catch (error) {
      console.error('Error en Paciente.findByOwner:', error);
      throw error;
    }
  },

  /**
   * Actualiza un paciente.
   * @param {number} id - ID del paciente.
   * @param {Object} updateData - Datos a actualizar.
   * @returns {Promise<Object | null>} Paciente actualizado o null.
   */
  async update(id, updateData, connection = null) {
    const executor = connection || getDB();
    
    try {
      const allowedFields = ['nombre', 'especie', 'raza', 'edad', 'peso', 'altura'];
      const updates = {};
      
      for (const key of allowedFields) {
        if (updateData[key] !== undefined) {
          updates[key] = updateData[key];
        }
      }

      if (Object.keys(updates).length === 0) {
        return await this.findById(id, executor);
      }

      let query = 'UPDATE pacientes SET ';
      const params = [];
      const fields = [];

      for (const [key, value] of Object.entries(updates)) {
        fields.push(`${key} = ?`);
        params.push(value);
      }

      query += fields.join(', ');
      query += ' WHERE id_mascota = ?';
      params.push(id);
      
      const [result] = await executor.execute(query, params);

      if (result.affectedRows === 0) {
        return null;
      }

      return await this.findById(id, executor);
    } catch (error) {
      console.error('Error en Paciente.update:', error);
      throw error;
    }
  },

  /**
   * Elimina un paciente.
   * @param {number} id - ID del paciente.
   * @returns {Promise<boolean>} true si se eliminó, false en caso contrario.
   */
  async delete(id, connection = null) {
    try {
      const executor = connection || getDB();
      const [result] = await executor.execute(
        'DELETE FROM pacientes WHERE id_mascota = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en Paciente.delete:', error);
      throw error;
    }
  }
};

module.exports = Paciente;
