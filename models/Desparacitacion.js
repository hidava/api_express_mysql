/**
 * Modelo Desparacitacion (DAO)
 * Tabla: desparacitacion
 */
const { getDB } = require('../config/database');

const Desparacitacion = {
  async create(data, connection = null) {
    const executor = connection || getDB();
    const { producto, fecha_aplicada, proxima_dosis, pacientes_id_mascota } = data;

    try {
      const [result] = await executor.execute(
        `INSERT INTO desparacitacion (producto, fecha_aplicada, proxima_dosis, pacientes_id_mascota)
         VALUES (?, ?, ?, ?)`,
        [producto, fecha_aplicada, proxima_dosis || null, pacientes_id_mascota]
      );
      return { insertId: result.insertId };
    } catch (error) {
      console.error('Error en Desparacitacion.create:', { message: error.message, stack: error.stack });
      throw error;
    }
  },

  /**
   * Obtiene todas las desparacitaciones.
   * @returns {Promise<Array>} Array de desparacitaciones.
   */
  async findAll(connection = null) {
    try {
      const executor = connection || getDB();
      const [rows] = await executor.execute(
        `SELECT d.id_desparacitacion, d.producto, d.fecha_aplicada, d.proxima_dosis, d.pacientes_id_mascota,
                p.nombre AS paciente_nombre, p.propietarios_cedula
         FROM desparacitacion d
         LEFT JOIN pacientes p ON p.id_mascota = d.pacientes_id_mascota
         ORDER BY d.id_desparacitacion DESC`
      );
      return rows;
    } catch (error) {
      console.error('Error en Desparacitacion.findAll:', error);
      throw error;
    }
  },

  /**
   * Obtiene una desparacitacion por su ID.
   * @param {number} id - ID de la desparacitacion.
   * @returns {Promise<Object | null>} Objeto desparacitacion o null.
   */
  async findById(id, connection = null) {
    try {
      const executor = connection || getDB();
      const [rows] = await executor.execute(
        `SELECT d.id_desparacitacion, d.producto, d.fecha_aplicada, d.proxima_dosis, d.pacientes_id_mascota,
                p.nombre AS paciente_nombre, p.propietarios_cedula
         FROM desparacitacion d
         LEFT JOIN pacientes p ON p.id_mascota = d.pacientes_id_mascota
         WHERE d.id_desparacitacion = ?`,
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error en Desparacitacion.findById:', error);
      throw error;
    }
  },

  /**
   * Obtiene todas las desparacitaciones de un paciente.
   * @param {number} pacienteId - ID del paciente.
   * @returns {Promise<Array>} Array de desparacitaciones.
   */
  async findByPaciente(pacienteId, connection = null) {
    try {
      const executor = connection || getDB();
      const [rows] = await executor.execute(
        `SELECT d.id_desparacitacion, d.producto, d.fecha_aplicada, d.proxima_dosis, d.pacientes_id_mascota,
                p.nombre AS paciente_nombre
         FROM desparacitacion d
         LEFT JOIN pacientes p ON p.id_mascota = d.pacientes_id_mascota
         WHERE d.pacientes_id_mascota = ?
         ORDER BY d.fecha_aplicada DESC`,
        [pacienteId]
      );
      return rows;
    } catch (error) {
      console.error('Error en Desparacitacion.findByPaciente:', error);
      throw error;
    }
  },

  /**
   * Actualiza una desparacitacion existente.
   * @param {number} id - ID de la desparacitacion a actualizar.
   * @param {Object} updateData - Datos a actualizar.
   * @returns {Promise<boolean>} True si se actualizó correctamente.
   */
  async update(id, updateData, connection = null) {
    try {
      const executor = connection || getDB();
      const allowedFields = ['producto', 'fecha_aplicada', 'proxima_dosis', 'pacientes_id_mascota'];
      const updates = [];
      const values = [];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(updateData[field]);
        }
      }

      if (updates.length === 0) {
        throw new Error('No hay campos para actualizar');
      }

      values.push(id);
      const sql = `UPDATE desparacitacion SET ${updates.join(', ')} WHERE id_desparacitacion = ?`;
      const [result] = await executor.execute(sql, values);

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en Desparacitacion.update:', error);
      throw error;
    }
  },

  /**
   * Elimina una desparacitacion.
   * @param {number} id - ID de la desparacitacion a eliminar.
   * @returns {Promise<boolean>} True si se eliminó correctamente.
   */
  async delete(id, connection = null) {
    try {
      const executor = connection || getDB();
      const [result] = await executor.execute(
        'DELETE FROM desparacitacion WHERE id_desparacitacion = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en Desparacitacion.delete:', error);
      throw error;
    }
  }
};

module.exports = Desparacitacion;
