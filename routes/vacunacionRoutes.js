const express = require('express');
const router = express.Router();
const vacunacionController = require('../controllers/vacunacionController');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// GET /api/v1/vacunacion/list - Listar todas las vacunaciones
router.get('/list',
  vacunacionController.getAllVacunaciones
);

// GET /api/v1/vacunacion/paciente/:pacienteId - Obtener vacunaciones de un paciente
router.get('/paciente/:pacienteId',
  vacunacionController.getVacunacionesByPaciente
);

// GET /api/v1/vacunacion/:id - Obtener una vacunacion
router.get('/:id',
  vacunacionController.getVacunacionById
);

// POST /api/v1/vacunacion - Crear vacunacion
router.post('/',
  body('nombre_vacuna').exists().withMessage('nombre_vacuna es requerido'),
  body('fecha_aplicacion').exists().withMessage('fecha_aplicacion es requerido'),
  body('pacientes_id_mascota').exists().withMessage('pacientes_id_mascota es requerido'),
  handleValidationErrors,
  vacunacionController.createVacunacion
);

// PUT /api/v1/vacunacion/:id - Actualizar vacunacion
router.put('/:id',
  body('nombre_vacuna').optional().isLength({ min: 2 }).withMessage('nombre_vacuna inválido'),
  body('fecha_aplicacion').optional().withMessage('fecha_aplicacion inválida'),
  handleValidationErrors,
  vacunacionController.updateVacunacion
);

// DELETE /api/v1/vacunacion/:id - Eliminar vacunacion
router.delete('/:id',
  vacunacionController.deleteVacunacion
);

module.exports = router;
