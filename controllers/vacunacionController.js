const Vacunacion = require('../models/Vacunacion');
const Paciente = require('../models/Paciente');
const { getDB } = require('../config/database');

exports.createVacunacion = async (req, res) => {
  try {
    const payload = req.body;
    const required = ['nombre_vacuna', 'fecha_aplicacion', 'pacientes_id_mascota'];
    for (const f of required) {
      if (!payload[f]) return res.status(400).json({ success: false, message: `${f} es requerido` });
    }

    // Verificar que el paciente exista
    const paciente = await Paciente.findById(payload.pacientes_id_mascota);
    if (!paciente) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado para el ID proporcionado' });
    }

    const result = await Vacunacion.create(payload);
    res.status(201).json({ success: true, message: 'Vacunacion registrada', id: result.insertId });
  } catch (error) {
    console.error('Error en createVacunacion:', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error en el servidor al registrar vacunacion' });
  }
};

exports.getAllVacunaciones = async (req, res) => {
  try {
    const vacunaciones = await Vacunacion.findAll();
    return res.status(200).json({ success: true, data: vacunaciones });
  } catch (error) {
    console.error('Error en getAllVacunaciones:', { message: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: 'Error en el servidor al obtener vacunaciones' });
  }
};

/**
 * GET /api/v1/vacunacion/:id
 * Obtiene una vacunacion por su ID
 */
exports.getVacunacionById = async (req, res) => {
  try {
    const { id } = req.params;
    const vacunacion = await Vacunacion.findById(id);
    
    if (!vacunacion) {
      return res.status(404).json({ success: false, message: 'Vacunacion no encontrada.' });
    }
    
    return res.status(200).json({ success: true, data: vacunacion });
  } catch (error) {
    console.error('Error en getVacunacionById:', error);
    res.status(500).json({ success: false, message: 'Error al obtener vacunacion.' });
  }
};

/**
 * GET /api/v1/vacunacion/paciente/:pacienteId
 * Obtiene todas las vacunaciones de un paciente
 */
exports.getVacunacionesByPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const vacunaciones = await Vacunacion.findByPaciente(pacienteId);
    
    return res.status(200).json({ success: true, data: vacunaciones });
  } catch (error) {
    console.error('Error en getVacunacionesByPaciente:', error);
    res.status(500).json({ success: false, message: 'Error al obtener vacunaciones del paciente.' });
  }
};

/**
 * PUT /api/v1/vacunacion/:id
 * Actualiza una vacunacion
 */
exports.updateVacunacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_vacuna, fecha_aplicacion, proxima_dosis } = req.body;
    
    const vacunacion = await Vacunacion.update(id, { nombre_vacuna, fecha_aplicacion, proxima_dosis });
    
    if (!vacunacion) {
      return res.status(404).json({ success: false, message: 'Vacunacion no encontrada.' });
    }
    
    return res.status(200).json({ success: true, data: vacunacion, message: 'Vacunacion actualizada correctamente.' });
  } catch (error) {
    console.error('Error en updateVacunacion:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar vacunacion.' });
  }
};

/**
 * DELETE /api/v1/vacunacion/:id
 * Elimina una vacunacion
 */
exports.deleteVacunacion = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Vacunacion.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Vacunacion no encontrada.' });
    }
    
    return res.status(200).json({ success: true, message: 'Vacunacion eliminada correctamente.' });
  } catch (error) {
    console.error('Error en deleteVacunacion:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar vacunacion.' });
  }
};
