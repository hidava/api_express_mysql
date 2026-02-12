const Propietario = require('../models/Propietario');

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
