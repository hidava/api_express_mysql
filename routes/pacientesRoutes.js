const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// GET /api/v1/pacientes/list - Listar todos los pacientes
router.get('/list',
  pacienteController.getAllPacientes
);

router.post('/',
  body('nombreMascota').exists().withMessage('nombreMascota es requerido'),
  body('especie').exists().withMessage('especie es requerido'),
  body('raza').exists().withMessage('raza es requerido'),
  body('propietarios_cedula').exists().withMessage('propietarios_cedula es requerido'),
  handleValidationErrors,
  pacienteController.createPaciente
);

router.post('/check',
  body('nombre').exists().withMessage('nombre es requerido'),
  body('propietarios_cedula').exists().withMessage('propietarios_cedula es requerido'),
  handleValidationErrors,
  pacienteController.checkPaciente
);

module.exports = router;
