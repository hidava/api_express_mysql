const Propietario = require('../models/Propietario');

/**
 * GET /api/v1/propietarios
 * Obtiene todos los propietarios
 */
exports.getAllPropietarios = async (req, res) => {
  try {
    const propietarios = await Propietario.findAll();
    return res.status(200).json({ success: true, data: propietarios });
  } catch (error) {
    console.error('Error en getAllPropietarios:', error);
    res.status(500).json({ success: false, message: 'Error al obtener propietarios.' });
  }
};

/**
 * GET /api/v1/propietarios/:cedula
 * Obtiene un propietario por cédula
 */
exports.getPropietarioByCedula = async (req, res) => {
  try {
    const { cedula } = req.params;
    const propietario = await Propietario.findByCedula(cedula);
    
    if (!propietario) {
      return res.status(404).json({ success: false, message: 'Propietario no encontrado.' });
    }
    
    return res.status(200).json({ success: true, data: propietario });
  } catch (error) {
    console.error('Error en getPropietarioByCedula:', error);
    res.status(500).json({ success: false, message: 'Error al obtener propietario.' });
  }
};

/**
 * PUT /api/v1/propietarios/:cedula
 * Actualiza un propietario
 */
exports.updatePropietario = async (req, res) => {
  try {
    const { cedula } = req.params;
    const { nombre, apellido, telefono, direccion } = req.body;
    
    const propietario = await Propietario.update(cedula, { nombre, apellido, telefono, direccion });
    
    if (!propietario) {
      return res.status(404).json({ success: false, message: 'Propietario no encontrado.' });
    }
    
    return res.status(200).json({ success: true, data: propietario, message: 'Propietario actualizado correctamente.' });
  } catch (error) {
    console.error('Error en updatePropietario:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar propietario.' });
  }
};

/**
 * DELETE /api/v1/propietarios/:cedula
 * Elimina un propietario
 */
exports.deletePropietario = async (req, res) => {
  try {
    const { cedula } = req.params;
    const deleted = await Propietario.delete(cedula);
    
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Propietario no encontrado.' });
    }
    
    return res.status(200).json({ success: true, message: 'Propietario eliminado correctamente.' });
  } catch (error) {
    console.error('Error en deletePropietario:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar propietario.' });
  }
};

/**
 * POST /api/v1/propietarios/check
 * Body: { cedula }
 * Response: { exists: true|false }
 */
exports.checkCedula = async (req, res) => {
  try {
    const { cedula } = req.body;
    if (!cedula) {
      return res.status(400).json({ success: false, message: 'La cédula es requerida.' });
    }

    const owner = await Propietario.findByCedula(cedula);
    return res.status(200).json({ success: true, exists: !!owner });
  } catch (error) {
    console.error('Error en checkCedula:', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error en el servidor al verificar cédula.' });
  }
};
