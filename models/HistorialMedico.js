/**
 * Modelo HistorialMedico (DAO)
 * Tabla: historial_medico
 */
const { getDB } = require('../config/database');

const HistorialMedico = {
  /**
   * Crear un nuevo registro de historial médico
   */
  async create(data, connection = null) {
    const executor = connection || getDB();
    const {
      motivo_consulta,
      diagnostico,
      tratamiento,
      pacientes_id_mascota,
      imagen_url,
      imagen_name
    } = data;

    try {
      const [result] = await executor.execute(
        `INSERT INTO historial_medico (motivo_consulta, diagnostico, tratamiento, pacientes_id_mascota, imagen_url, imagen_name)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          motivo_consulta,
          diagnostico || null,
          tratamiento || null,
          pacientes_id_mascota,
          imagen_url || null,
          imagen_name || null
        ]
      );
      return { insertId: result.insertId };
    } catch (error) {
      console.error('Error en HistorialMedico.create:', { message: error.message, stack: error.stack });
      throw error;
    }
  },

  /**
   * Obtener todos los registros de historial médico con información del paciente
   */
  async findAll(connection = null) {
    const executor = connection || getDB();
    try {
      const [rows] = await executor.execute(
        `SELECT h.id, h.motivo_consulta, h.diagnostico, h.tratamiento, h.imagen_url, h.imagen_name, 
                h.pacientes_id_mascota, p.nombre AS paciente_nombre
         FROM historial_medico h
         LEFT JOIN pacientes p ON p.id_mascota = h.pacientes_id_mascota
         ORDER BY h.id DESC`
      );
      return rows;
    } catch (error) {
      console.error('Error en HistorialMedico.findAll:', { message: error.message, stack: error.stack });
      throw error;
    }
  },

  /**
   * Obtener historial médico por ID
   */
  async findById(id, connection = null) {
    const executor = connection || getDB();
    try {
      const [rows] = await executor.execute(
        `SELECT h.id, h.motivo_consulta, h.diagnostico, h.tratamiento, h.imagen_url, h.imagen_name,
                h.pacientes_id_mascota, p.nombre AS paciente_nombre
         FROM historial_medico h
         LEFT JOIN pacientes p ON p.id_mascota = h.pacientes_id_mascota
         WHERE h.id = ?`,
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error en HistorialMedico.findById:', { message: error.message, stack: error.stack });
      throw error;
    }
  },

  /**
   * Obtener historial médico por ID de paciente
   */
  async findByPacienteId(pacienteId, connection = null) {
    const executor = connection || getDB();
    try {
      const [rows] = await executor.execute(
        `SELECT h.id, h.motivo_consulta, h.diagnostico, h.tratamiento, h.imagen_url, h.imagen_name,
                h.pacientes_id_mascota, p.nombre AS paciente_nombre
         FROM historial_medico h
         LEFT JOIN pacientes p ON p.id_mascota = h.pacientes_id_mascota
         WHERE h.pacientes_id_mascota = ?
         ORDER BY h.id DESC`,
        [pacienteId]
      );
      return rows;
    } catch (error) {
      console.error('Error en HistorialMedico.findByPacienteId:', { message: error.message, stack: error.stack });
      throw error;
    }
  },

  /**
   * Obtener vista completa con información de propietario, paciente e historial
   */
  async getVistaCompleta(cedula = null, connection = null) {
    const executor = connection || getDB();
    try {
      let query = `
        SELECT pro.cedula AS cedula,
               pro.nombre AS nombre_propietario,
               pro.apellido AS apellido_propietario,
               pro.telefono AS telefono,
               pro.direccion AS direccion,
               pac.id_mascota AS pacientes_id_mascota,
               pac.nombre AS nombre_mascota,
               pac.especie AS especie,
               pac.raza AS raza,
               pac.edad AS edad,
               pac.peso AS peso,
               pac.altura AS altura,
               h.id AS historial_id,
               h.motivo_consulta AS motivo_consulta,
               h.diagnostico AS diagnostico,
               h.tratamiento AS tratamiento,
               h.imagen_url AS imagen_url,
               h.imagen_name AS imagen_name
        FROM propietarios pro
        JOIN pacientes pac ON pro.cedula = pac.propietarios_cedula
        JOIN historial_medico h ON pac.id_mascota = h.pacientes_id_mascota
      `;

      if (cedula) {
        query += ' WHERE pro.cedula = ?';
        const [rows] = await executor.execute(query + ' ORDER BY pac.nombre', [cedula]);
        return rows;
      } else {
        const [rows] = await executor.execute(query + ' ORDER BY pac.nombre');
        return rows;
      }
    } catch (error) {
      console.error('Error en HistorialMedico.getVistaCompleta:', { message: error.message, stack: error.stack });
      throw error;
    }
  },

  /**
   * Actualizar un registro de historial médico
   */
  async update(id, data, connection = null) {
    const executor = connection || getDB();
    const {
      motivo_consulta,
      diagnostico,
      tratamiento,
      imagen_url,
      imagen_name
    } = data;

    const fields = [];
    const values = [];

    if (motivo_consulta !== undefined) {
      fields.push('motivo_consulta = ?');
      values.push(motivo_consulta);
    }
    if (diagnostico !== undefined) {
      fields.push('diagnostico = ?');
      values.push(diagnostico);
    }
    if (tratamiento !== undefined) {
      fields.push('tratamiento = ?');
      values.push(tratamiento);
    }
    if (imagen_url !== undefined) {
      fields.push('imagen_url = ?');
      values.push(imagen_url);
    }
    if (imagen_name !== undefined) {
      fields.push('imagen_name = ?');
      values.push(imagen_name);
    }

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    values.push(id);

    try {
      const [result] = await executor.execute(
        `UPDATE historial_medico SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      return { affectedRows: result.affectedRows };
    } catch (error) {
      console.error('Error en HistorialMedico.update:', { message: error.message, stack: error.stack });
      throw error;
    }
  },

  /**
   * Eliminar un registro de historial médico
   */
  async delete(id, connection = null) {
    const executor = connection || getDB();
    try {
      const [result] = await executor.execute(
        'DELETE FROM historial_medico WHERE id = ?',
        [id]
      );
      return { affectedRows: result.affectedRows };
    } catch (error) {
      console.error('Error en HistorialMedico.delete:', { message: error.message, stack: error.stack });
      throw error;
    }
  }
};

module.exports = HistorialMedico;
