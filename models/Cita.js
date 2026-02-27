/**
 * Modelo Cita (DAO)
 * Tabla: citas
 */
const { getDB } = require('../config/database');

const Cita = {
  /**
   * Crea una nueva cita
   * @param {Object} data - Datos de la cita
   * @returns {Promise<Object>} Objeto con insertId
   */
  async create(data, connection = null) {
    const executor = connection || getDB();
    const { 
      propietarios_cedula, 
      pacientes_id_mascota, 
      fecha_cita, 
      hora_cita, 
      descripcion,
      sede,
      estado 
    } = data;

    try {
      const [result] = await executor.execute(
        `INSERT INTO citas (propietarios_cedula, pacientes_id_mascota, sede, fecha_cita, hora_cita, descripcion, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          propietarios_cedula, 
          pacientes_id_mascota, 
          sede || 'Patitas Felices Alajuela',
          fecha_cita, 
          hora_cita, 
          descripcion || null,
          estado || 'pendiente'
        ]
      );
      return { insertId: result.insertId };
    } catch (error) {
      console.error('Error en Cita.create:', { message: error.message, stack: error.stack });
      throw error;
    }
  },

  /**
   * Obtiene todas las citas con información de propietario y mascota
   * @returns {Promise<Array>} Array de citas
   */
  async findAll(connection = null) {
    try {
      const executor = connection || getDB();
      const [rows] = await executor.execute(
        `SELECT 
          c.id_cita, 
          c.propietarios_cedula, 
          c.pacientes_id_mascota, 
          c.sede,
          c.fecha_cita, 
          c.hora_cita, 
          c.descripcion, 
          c.estado,
          c.fecha_creacion,
          c.fecha_actualizacion,
          p.nombre AS propietario_nombre,
          p.apellido AS propietario_apellido,
          p.telefono AS propietario_telefono,
          pac.nombre AS paciente_nombre,
          pac.especie AS paciente_especie,
          pac.raza AS paciente_raza
         FROM citas c
         LEFT JOIN propietarios p ON p.cedula = c.propietarios_cedula
         LEFT JOIN pacientes pac ON pac.id_mascota = c.pacientes_id_mascota
         ORDER BY c.fecha_cita DESC, c.hora_cita DESC`
      );
      return rows;
    } catch (error) {
      console.error('Error en Cita.findAll:', error);
      throw error;
    }
  },

  /**
   * Obtiene una cita por su ID
   * @param {number} id - ID de la cita
   * @returns {Promise<Object | null>} Objeto cita o null
   */
  async findById(id, connection = null) {
    try {
      const executor = connection || getDB();
      const [rows] = await executor.execute(
        `SELECT 
          c.id_cita, 
          c.propietarios_cedula, 
          c.pacientes_id_mascota, 
          c.sede,
          c.fecha_cita, 
          c.hora_cita, 
          c.descripcion, 
          c.estado,
          c.fecha_creacion,
          c.fecha_actualizacion,
          p.nombre AS propietario_nombre,
          p.apellido AS propietario_apellido,
          p.telefono AS propietario_telefono,
          pac.nombre AS paciente_nombre,
          pac.especie AS paciente_especie,
          pac.raza AS paciente_raza
         FROM citas c
         LEFT JOIN propietarios p ON p.cedula = c.propietarios_cedula
         LEFT JOIN pacientes pac ON pac.id_mascota = c.pacientes_id_mascota
         WHERE c.id_cita = ?`,
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error en Cita.findById:', error);
      throw error;
    }
  },

  /**
   * Obtiene citas de un propietario
   * @param {number} cedulaPropietario - Cédula del propietario
   * @returns {Promise<Array>} Array de citas
   */
  async findByPropietario(cedulaPropietario, connection = null) {
    try {
      const executor = connection || getDB();
      const [rows] = await executor.execute(
        `SELECT 
          c.id_cita, 
          c.propietarios_cedula, 
          c.pacientes_id_mascota, 
          c.sede,
          c.fecha_cita, 
          c.hora_cita, 
          c.descripcion, 
          c.estado,
          pac.nombre AS paciente_nombre
         FROM citas c
         LEFT JOIN pacientes pac ON pac.id_mascota = c.pacientes_id_mascota
         WHERE c.propietarios_cedula = ?
         ORDER BY c.fecha_cita DESC, c.hora_cita DESC`,
        [cedulaPropietario]
      );
      return rows;
    } catch (error) {
      console.error('Error en Cita.findByPropietario:', error);
      throw error;
    }
  },

  /**
   * Obtiene citas de una mascota
   * @param {number} idMascota - ID de la mascota
   * @returns {Promise<Array>} Array de citas
   */
  async findByPaciente(idMascota, connection = null) {
    try {
      const executor = connection || getDB();
      const [rows] = await executor.execute(
        `SELECT 
          c.id_cita, 
          c.propietarios_cedula, 
          c.pacientes_id_mascota, 
          c.sede,
          c.fecha_cita, 
          c.hora_cita, 
          c.descripcion, 
          c.estado,
          p.nombre AS propietario_nombre
         FROM citas c
         LEFT JOIN propietarios p ON p.cedula = c.propietarios_cedula
         WHERE c.pacientes_id_mascota = ?
         ORDER BY c.fecha_cita DESC, c.hora_cita DESC`,
        [idMascota]
      );
      return rows;
    } catch (error) {
      console.error('Error en Cita.findByPaciente:', error);
      throw error;
    }
  },

  /**
   * Obtiene citas de una fecha específica
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @returns {Promise<Array>} Array de citas
   */
  async findByFecha(fecha, connection = null) {
    try {
      const executor = connection || getDB();
      const [rows] = await executor.execute(
        `SELECT 
          c.id_cita, 
          c.propietarios_cedula, 
          c.pacientes_id_mascota, 
          c.sede,
          c.fecha_cita, 
          c.hora_cita, 
          c.descripcion, 
          c.estado,
          p.nombre AS propietario_nombre,
          pac.nombre AS paciente_nombre
         FROM citas c
         LEFT JOIN propietarios p ON p.cedula = c.propietarios_cedula
         LEFT JOIN pacientes pac ON pac.id_mascota = c.pacientes_id_mascota
         WHERE c.fecha_cita = ? AND c.estado != 'cancelada'
         ORDER BY c.hora_cita ASC`,
        [fecha]
      );
      return rows;
    } catch (error) {
      console.error('Error en Cita.findByFecha:', error);
      throw error;
    }
  },

  /**
   * Cuenta cuántas citas hay en una fecha y hora específica (excluyendo canceladas)
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @param {string} hora - Hora en formato HH:MM:SS
   * @returns {Promise<number>} Número de citas
   */
  async countByFechaHora(fecha, hora, connection = null) {
    try {
      const executor = connection || getDB();
      const [rows] = await executor.execute(
        `SELECT COUNT(*) as total
         FROM citas
         WHERE fecha_cita = ? AND hora_cita = ? AND estado != 'cancelada'`,
        [fecha, hora]
      );
      return rows[0].total;
    } catch (error) {
      console.error('Error en Cita.countByFechaHora:', error);
      throw error;
    }
  },

  /**
   * Cuenta cuántas citas hay en una fecha (excluyendo canceladas)
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @returns {Promise<number>} Número de citas
   */
  async countByFecha(fecha, connection = null) {
    try {
      const executor = connection || getDB();
      const [rows] = await executor.execute(
        `SELECT COUNT(*) as total
         FROM citas
         WHERE fecha_cita = ? AND estado != 'cancelada'`,
        [fecha]
      );
      return rows[0].total;
    } catch (error) {
      console.error('Error en Cita.countByFecha:', error);
      throw error;
    }
  },

  /**
   * Actualiza una cita
   * @param {number} id - ID de la cita
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<boolean>} true si se actualizó, false si no existe
   */
  async update(id, updateData, connection = null) {
    try {
      const executor = connection || getDB();
      const allowedFields = [
        'propietarios_cedula',
        'pacientes_id_mascota',
        'sede',
        'fecha_cita',
        'hora_cita',
        'descripcion',
        'estado'
      ];

      const fields = [];
      const values = [];

      for (const field of allowedFields) {
        if (updateData.hasOwnProperty(field)) {
          fields.push(`${field} = ?`);
          values.push(updateData[field]);
        }
      }

      if (fields.length === 0) {
        return false;
      }

      values.push(id);

      const [result] = await executor.execute(
        `UPDATE citas SET ${fields.join(', ')} WHERE id_cita = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en Cita.update:', error);
      throw error;
    }
  },

  /**
   * Elimina una cita
   * @param {number} id - ID de la cita
   * @returns {Promise<boolean>} true si se eliminó, false si no existe
   */
  async delete(id, connection = null) {
    try {
      const executor = connection || getDB();
      const [result] = await executor.execute(
        `DELETE FROM citas WHERE id_cita = ?`,
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en Cita.delete:', error);
      throw error;
    }
  }
};

module.exports = Cita;
