const Paciente = require('../models/Paciente');
const Propietario = require('../models/Propietario');

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
