const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// GET /api/v1/pacientes/list - Listar todos los pacientes
router.get('/list',
  pacienteController.getAllPacientes
);

// GET /api/v1/pacientes/owner/:cedula - Obtener pacientes de un propietario
router.get('/owner/:cedula',
  pacienteController.getPacientesByOwner
);

// GET /api/v1/pacientes/:id - Obtener un paciente
router.get('/:id',
  pacienteController.getPacienteById
);

// POST /api/v1/pacientes - Crear paciente
router.post('/',
  body('nombreMascota').exists().withMessage('nombreMascota es requerido'),
  body('especie').exists().withMessage('especie es requerido'),
  body('raza').exists().withMessage('raza es requerido'),
  body('propietarios_cedula').exists().withMessage('propietarios_cedula es requerido'),
  handleValidationErrors,
  pacienteController.createPaciente
);

// PUT /api/v1/pacientes/:id - Actualizar paciente
router.put('/:id',
  body('nombre').optional().isLength({ min: 2 }).withMessage('Nombre inválido'),
  body('especie').optional().isLength({ min: 2 }).withMessage('Especie inválida'),
  body('raza').optional().isLength({ min: 2 }).withMessage('Raza inválida'),
  handleValidationErrors,
  pacienteController.updatePaciente
);

// DELETE /api/v1/pacientes/:id - Eliminar paciente
router.delete('/:id',
  pacienteController.deletePaciente
);

// POST /api/v1/pacientes/check
router.post('/check',
  body('nombre').exists().withMessage('nombre es requerido'),
  body('propietarios_cedula').exists().withMessage('propietarios_cedula es requerido'),
  handleValidationErrors,
  pacienteController.checkPaciente
);

module.exports = router;
