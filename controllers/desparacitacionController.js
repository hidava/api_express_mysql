const Desparacitacion = require('../models/Desparacitacion');
const Paciente = require('../models/Paciente');
const { getDB } = require('../config/database');

exports.createDesparacitacion = async (req, res) => {
  try {
    const payload = req.body;
    const required = ['producto', 'fecha_aplicada', 'pacientes_id_mascota'];
    for (const f of required) {
      if (!payload[f]) return res.status(400).json({ success: false, message: `${f} es requerido` });
    }

    // Verificar que el paciente exista
    const paciente = await Paciente.findById(payload.pacientes_id_mascota);
    if (!paciente) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado para el ID proporcionado' });
    }

    const result = await Desparacitacion.create(payload);
    res.status(201).json({ success: true, message: 'Desparacitacion registrada', id: result.insertId });
  } catch (error) {
    console.error('Error en createDesparacitacion:', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error en el servidor al registrar desparacitacion' });
  }
};

exports.getAllDesparacitaciones = async (req, res) => {
  try {
    const desparacitaciones = await Desparacitacion.findAll();
    return res.status(200).json({ success: true, data: desparacitaciones });
  } catch (error) {
    console.error('Error en getAllDesparacitaciones:', { message: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: 'Error en el servidor al obtener desparacitaciones' });
  }
};

/**
 * GET /api/v1/desparacitacion/:id
 * Obtiene una desparacitacion por su ID
 */
exports.getDesparacitacionById = async (req, res) => {
  try {
    const { id } = req.params;
    const desparacitacion = await Desparacitacion.findById(id);

    if (!desparacitacion) {
      return res.status(404).json({ success: false, message: 'Desparacitacion no encontrada' });
    }

    return res.status(200).json({ success: true, data: desparacitacion });
  } catch (error) {
    console.error('Error en getDesparacitacionById:', { message: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: 'Error en el servidor al obtener desparacitacion' });
  }
};

/**
 * GET /api/v1/desparacitacion/paciente/:pacienteId
 * Obtiene todas las desparacitaciones de un paciente
 */
exports.getDesparacitacionesByPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const desparacitaciones = await Desparacitacion.findByPaciente(pacienteId);
    return res.status(200).json({ success: true, data: desparacitaciones });
  } catch (error) {
    console.error('Error en getDesparacitacionesByPaciente:', { message: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: 'Error en el servidor al obtener desparacitaciones del paciente' });
  }
};

/**
 * PUT /api/v1/desparacitacion/:id
 * Actualiza una desparacitacion existente
 */
exports.updateDesparacitacion = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar que la desparacitacion existe
    const existing = await Desparacitacion.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Desparacitacion no encontrada' });
    }

    // Si se cambia el paciente, verificar que exista
    if (updateData.pacientes_id_mascota) {
      const paciente = await Paciente.findById(updateData.pacientes_id_mascota);
      if (!paciente) {
        return res.status(404).json({ success: false, message: 'Paciente no encontrado para el ID proporcionado' });
      }
    }

    const updated = await Desparacitacion.update(id, updateData);
    if (!updated) {
      return res.status(400).json({ success: false, message: 'No se pudo actualizar la desparacitacion' });
    }

    res.status(200).json({ success: true, message: 'Desparacitacion actualizada correctamente' });
  } catch (error) {
    console.error('Error en updateDesparacitacion:', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error en el servidor al actualizar desparacitacion' });
  }
};

/**
 * DELETE /api/v1/desparacitacion/:id
 * Elimina una desparacitacion
 */
exports.deleteDesparacitacion = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que existe
    const existing = await Desparacitacion.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Desparacitacion no encontrada' });
    }

    const deleted = await Desparacitacion.delete(id);
    if (!deleted) {
      return res.status(400).json({ success: false, message: 'No se pudo eliminar la desparacitacion' });
    }

    res.status(200).json({ success: true, message: 'Desparacitacion eliminada correctamente' });
  } catch (error) {
    console.error('Error en deleteDesparacitacion:', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error en el servidor al eliminar desparacitacion' });
  }
};
