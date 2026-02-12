const { connectDB } = require('../config/database');
const Paciente = require('../models/Paciente');

(async () => {
  try {
    await connectDB();
    const payload = { nombreMascota: 'DirectTest', especie: 'Perro', raza: 'Mix', edad: 3, peso: 4.2, altura: 35, propietarios_cedula: '207650988' };
    const res = await Paciente.create(payload);
    console.log('Insert result:', res);
  } catch (err) {
    console.error('Error al crear paciente directamente:', { message: err.message, stack: err.stack });
  } finally {
    process.exit(0);
  }
})();
