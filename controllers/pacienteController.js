const Paciente = require('../models/Paciente');
const Propietario = require('../models/Propietario');
const { getDB } = require('../config/database');

exports.createPaciente = async (req, res) => {
  try {
    const payload = req.body;
    const required = ['nombreMascota', 'especie', 'raza', 'propietarios_cedula'];
    for (const f of required) {
      if (!payload[f]) return res.status(400).json({ success: false, message: `${f} es requerido` });
    }

    // Verificar que el propietario exista
    const owner = await Propietario.findByCedula(payload.propietarios_cedula);
    if (!owner) {
      return res.status(404).json({ success: false, message: 'Propietario no encontrado para la cédula proporcionada' });
    }

    const result = await Paciente.create(payload);
    res.status(201).json({ success: true, message: 'Paciente creado', id: result.insertId });
  } catch (error) {
    console.error('Error en createPaciente:', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error en el servidor al crear paciente' });
  }
};

exports.checkPaciente = async (req, res) => {
  try {
    const { nombre, propietarios_cedula } = req.body || {};
    if (!nombre || !propietarios_cedula) {
      return res.status(400).json({ success: false, message: 'nombre y propietarios_cedula son requeridos' });
    }

    const pool = getDB();
    const [rows] = await pool.execute(
      'SELECT id_mascota FROM pacientes WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(?)) AND propietarios_cedula = ? LIMIT 1',
      [nombre.trim(), propietarios_cedula]
    );

    return res.status(200).json({ exists: rows.length > 0 });
  } catch (error) {
    console.error('Error en checkPaciente:', { message: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: 'Error en el servidor al verificar paciente' });
  }
};

exports.getAllPacientes = async (req, res) => {
  try {
    const pool = getDB();
    const [rows] = await pool.execute(
      `SELECT id_mascota AS id, nombre, especie, raza, edad, peso, altura, propietarios_cedula
       FROM pacientes
       ORDER BY nombre ASC`
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error en getAllPacientes:', { message: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: 'Error en el servidor al obtener pacientes' });
  }
};

/**
 * GET /api/v1/pacientes/:id
 * Obtiene un paciente por su ID
 */
exports.getPacienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const paciente = await Paciente.findById(id);
    
    if (!paciente) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado.' });
    }
    
    return res.status(200).json({ success: true, data: paciente });
  } catch (error) {
    console.error('Error en getPacienteById:', error);
    res.status(500).json({ success: false, message: 'Error al obtener paciente.' });
  }
};

/**
 * GET /api/v1/pacientes/owner/:cedula
 * Obtiene todos los pacientes de un propietario
 */
exports.getPacientesByOwner = async (req, res) => {
  try {
    const { cedula } = req.params;
    const pacientes = await Paciente.findByOwner(cedula);
    
    return res.status(200).json({ success: true, data: pacientes });
  } catch (error) {
    console.error('Error en getPacientesByOwner:', error);
    res.status(500).json({ success: false, message: 'Error al obtener pacientes del propietario.' });
  }
};

/**
 * PUT /api/v1/pacientes/:id
 * Actualiza un paciente
 */
exports.updatePaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, especie, raza, edad, peso, altura } = req.body;
    
    const paciente = await Paciente.update(id, { nombre, especie, raza, edad, peso, altura });
    
    if (!paciente) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado.' });
    }
    
    return res.status(200).json({ success: true, data: paciente, message: 'Paciente actualizado correctamente.' });
  } catch (error) {
    console.error('Error en updatePaciente:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar paciente.' });
  }
};

/**
 * DELETE /api/v1/pacientes/:id
 * Elimina un paciente
 */
exports.deletePaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Paciente.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado.' });
    }
    
    return res.status(200).json({ success: true, message: 'Paciente eliminado correctamente.' });
  } catch (error) {
    console.error('Error en deletePaciente:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar paciente.' });
  }
};
