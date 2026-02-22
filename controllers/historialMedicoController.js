/**
 * Controlador de Historial Médico
 * Maneja las operaciones CRUD para el historial médico de pacientes
 */
const HistorialMedico = require('../models/HistorialMedico');
const { getDB } = require('../config/database');

/**
 * Crear un nuevo registro de historial médico
 * POST /api/v1/historial-medico
 */
exports.createHistorial = async (req, res) => {
  try {
    const {
      motivo_consulta,
      diagnostico,
      tratamiento,
      pacientes_id_mascota,
      imagen_url,
      imagen_name
    } = req.body;

    // Validaciones
    if (!motivo_consulta || motivo_consulta.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El motivo de consulta es obligatorio'
      });
    }

    if (!pacientes_id_mascota) {
      return res.status(400).json({
        success: false,
        message: 'El ID del paciente es obligatorio'
      });
    }

    // Verificar que el paciente exista
    const pool = getDB();
    const [pacientes] = await pool.execute(
      'SELECT id_mascota FROM pacientes WHERE id_mascota = ?',
      [pacientes_id_mascota]
    );

    if (pacientes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Crear el registro
    const result = await HistorialMedico.create({
      motivo_consulta,
      diagnostico,
      tratamiento,
      pacientes_id_mascota,
      imagen_url,
      imagen_name
    });

    res.status(201).json({
      success: true,
      message: 'Historial médico creado exitosamente',
      insertId: result.insertId
    });
  } catch (error) {
    console.error('Error en createHistorial:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Error en el servidor al crear el historial médico'
    });
  }
};

/**
 * Obtener todos los registros de historial médico
 * GET /api/v1/historial-medico
 * Query params opcionales: 
 *   - vista=true: devuelve vista completa con propietarios
 *   - paciente_id: filtra por paciente
 *   - historial_id: obtiene un historial específico
 */
exports.getAllHistoriales = async (req, res) => {
  try {
    const { vista, paciente_id, historial_id } = req.query;

    // Si piden un historial específico por ID
    if (historial_id) {
      const historial = await HistorialMedico.findById(historial_id);
      if (!historial) {
        return res.status(404).json({
          success: false,
          message: 'Historial no encontrado'
        });
      }
      return res.status(200).json({
        success: true,
        data: [historial]
      });
    }

    // Si piden filtrar por paciente
    if (paciente_id) {
      // Si además piden la vista completa, obtener por cédula del propietario
      if (vista === 'true') {
        try {
          const pool = getDB();
          const [[pac]] = await pool.execute(
            'SELECT propietarios_cedula FROM pacientes WHERE id_mascota = ? LIMIT 1',
            [paciente_id]
          );
          
          if (pac && pac.propietarios_cedula) {
            const vistaData = await HistorialMedico.getVistaCompleta(pac.propietarios_cedula);
            return res.status(200).json({
              success: true,
              data: vistaData
            });
          }
        } catch (err) {
          console.error('Error obteniendo vista por cédula:', err.message);
        }
      }

      // Fallback: obtener historial por ID de paciente
      const historiales = await HistorialMedico.findByPacienteId(paciente_id);
      return res.status(200).json({
        success: true,
        data: historiales
      });
    }

    // Si piden la vista completa sin filtros
    if (vista === 'true') {
      try {
        const vistaData = await HistorialMedico.getVistaCompleta();
        return res.status(200).json({
          success: true,
          data: vistaData
        });
      } catch (err) {
        console.error('Error obteniendo vista completa:', err.message);
        // Fallback a la consulta normal
      }
    }

    // Por defecto: obtener todos los historiales
    const historiales = await HistorialMedico.findAll();
    res.status(200).json({
      success: true,
      data: historiales
    });
  } catch (error) {
    console.error('Error en getAllHistoriales:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Error en el servidor al obtener historiales médicos'
    });
  }
};

/**
 * Obtener un historial médico por ID
 * GET /api/v1/historial-medico/:id
 */
exports.getHistorialById = async (req, res) => {
  try {
    const { id } = req.params;

    const historial = await HistorialMedico.findById(id);

    if (!historial) {
      return res.status(404).json({
        success: false,
        message: 'Historial médico no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: historial
    });
  } catch (error) {
    console.error('Error en getHistorialById:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Error en el servidor al obtener el historial médico'
    });
  }
};

/**
 * Obtener historiales médicos por ID de paciente
 * GET /api/v1/historial-medico/paciente/:pacienteId
 */
exports.getHistorialesByPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;

    const historiales = await HistorialMedico.findByPacienteId(pacienteId);

    res.status(200).json({
      success: true,
      data: historiales,
      count: historiales.length
    });
  } catch (error) {
    console.error('Error en getHistorialesByPaciente:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Error en el servidor al obtener historiales del paciente'
    });
  }
};

/**
 * Actualizar un historial médico
 * PUT /api/v1/historial-medico/:id
 */
exports.updateHistorial = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      motivo_consulta,
      diagnostico,
      tratamiento,
      imagen_url,
      imagen_name
    } = req.body;

    // Verificar que el historial exista
    const historialExistente = await HistorialMedico.findById(id);
    if (!historialExistente) {
      return res.status(404).json({
        success: false,
        message: 'Historial médico no encontrado'
      });
    }

    // Actualizar
    const updateData = {};
    if (motivo_consulta !== undefined) updateData.motivo_consulta = motivo_consulta;
    if (diagnostico !== undefined) updateData.diagnostico = diagnostico;
    if (tratamiento !== undefined) updateData.tratamiento = tratamiento;
    if (imagen_url !== undefined) updateData.imagen_url = imagen_url;
    if (imagen_name !== undefined) updateData.imagen_name = imagen_name;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    const result = await HistorialMedico.update(id, updateData);

    // Obtener el historial actualizado
    const historialActualizado = await HistorialMedico.findById(id);

    res.status(200).json({
      success: true,
      message: 'Historial médico actualizado exitosamente',
      affectedRows: result.affectedRows,
      data: historialActualizado
    });
  } catch (error) {
    console.error('Error en updateHistorial:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Error en el servidor al actualizar el historial médico'
    });
  }
};

/**
 * Eliminar un historial médico
 * DELETE /api/v1/historial-medico/:id
 */
exports.deleteHistorial = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el historial exista
    const historial = await HistorialMedico.findById(id);
    if (!historial) {
      return res.status(404).json({
        success: false,
        message: 'Historial médico no encontrado'
      });
    }

    const result = await HistorialMedico.delete(id);

    res.status(200).json({
      success: true,
      message: 'Historial médico eliminado exitosamente',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Error en deleteHistorial:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Error en el servidor al eliminar el historial médico'
    });
  }
};
