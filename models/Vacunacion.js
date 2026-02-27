/**
 * Modelo Vacunacion (DAO)
 * Tabla: vacunacion
 */
const { getDB } = require('../config/database');

const Vacunacion = {
  async create(data, connection = null) {
    const executor = connection || getDB();
    const { nombre_vacuna, fecha_aplicacion, proxima_dosis, pacientes_id_mascota } = data;

    try {
      const [result] = await executor.execute(
        `INSERT INTO vacunacion (nombre_vacuna, fecha_aplicacion, proxima_dosis, pacientes_id_mascota)
         VALUES (?, ?, ?, ?)`,
        [nombre_vacuna, fecha_aplicacion, proxima_dosis || null, pacientes_id_mascota]
      );
      return { insertId: result.insertId };
    } catch (error) {
      console.error('Error en Vacunacion.create:', { message: error.message, stack: error.stack });
      throw error;
    }
  },

  /**
   * Obtiene todas las vacunaciones.
   * @returns {Promise<Array>} Array de vacunaciones.
   */
  async findAll(connection = null) {
    try {
      const executor = connection || getDB();
      const [rows] = await executor.execute(
        `SELECT v.id_vacunacion, v.nombre_vacuna, v.fecha_aplicacion, v.proxima_dosis, v.pacientes_id_mascota,
                p.nombre AS paciente_nombre, p.propietarios_cedula
         FROM vacunacion v
         LEFT JOIN pacientes p ON p.id_mascota = v.pacientes_id_mascota
         ORDER BY v.id_vacunacion DESC`
      );
      return rows;
    } catch (error) {
      console.error('Error en Vacunacion.findAll:', error);
      throw error;
    }
  },

  /**
   * Obtiene una vacunacion por su ID.
   * @param {number} id - ID de la vacunacion.
   * @returns {Promise<Object | null>} Objeto vacunacion o null.
   */
  async findById(id, connection = null) {
    try {
      const executor = connection || getDB();
      const [rows] = await executor.execute(
        `SELECT v.id_vacunacion, v.nombre_vacuna, v.fecha_aplicacion, v.proxima_dosis, v.pacientes_id_mascota,
                p.nombre AS paciente_nombre, p.propietarios_cedula
         FROM vacunacion v
         LEFT JOIN pacientes p ON p.id_mascota = v.pacientes_id_mascota
         WHERE v.id_vacunacion = ?`,
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error en Vacunacion.findById:', error);
      throw error;
    }
  },

  /**
   * Obtiene todas las vacunaciones de un paciente.
   * @param {number} pacienteId - ID del paciente.
   * @returns {Promise<Array>} Array de vacunaciones del paciente.
   */
  async findByPaciente(pacienteId, connection = null) {
    try {
      const executor = connection || getDB();
      const [rows] = await executor.execute(
        `SELECT v.id_vacunacion, v.nombre_vacuna, v.fecha_aplicacion, v.proxima_dosis, v.pacientes_id_mascota,
                p.nombre AS paciente_nombre
         FROM vacunacion v
         LEFT JOIN pacientes p ON p.id_mascota = v.pacientes_id_mascota
         WHERE v.pacientes_id_mascota = ?
         ORDER BY v.fecha_aplicacion DESC`,
        [pacienteId]
      );
      return rows;
    } catch (error) {
      console.error('Error en Vacunacion.findByPaciente:', error);
      throw error;
    }
  },

  /**
   * Actualiza una vacunacion.
   * @param {number} id - ID de la vacunacion.
   * @param {Object} updateData - Datos a actualizar.
   * @returns {Promise<Object | null>} Vacunacion actualizada o null.
   */
  async update(id, updateData, connection = null) {
    const executor = connection || getDB();
    
    try {
      const allowedFields = ['nombre_vacuna', 'fecha_aplicacion', 'proxima_dosis'];
      const updates = {};
      
      for (const key of allowedFields) {
        if (updateData[key] !== undefined) {
          updates[key] = updateData[key];
        }
      }

      if (Object.keys(updates).length === 0) {
        return await this.findById(id, executor);
      }

      const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = [...Object.values(updates), id];

      const [result] = await executor.execute(
        `UPDATE vacunacion SET ${setClause} WHERE id_vacunacion = ?`,
        values
      );

      if (result.affectedRows === 0) {
        return null;
      }

      return await this.findById(id, executor);
    } catch (error) {
      console.error('Error en Vacunacion.update:', error);
      throw error;
    }
  },

  /**
   * Elimina una vacunacion.
   * @param {number} id - ID de la vacunacion.
   * @returns {Promise<boolean>} True si se eliminó, false si no encontrado.
   */
  async delete(id, connection = null) {
    try {
      const executor = connection || getDB();
      const [result] = await executor.execute(
        'DELETE FROM vacunacion WHERE id_vacunacion = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en Vacunacion.delete:', error);
      throw error;
    }
  }
};

module.exports = Vacunacion;
