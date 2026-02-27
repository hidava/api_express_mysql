const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const desparacitacionController = require('../controllers/desparacitacionController');

// GET /api/v1/desparacitacion/list - Lista todas las desparacitaciones
router.get('/list', desparacitacionController.getAllDesparacitaciones);

// GET /api/v1/desparacitacion/paciente/:pacienteId - Desparacitaciones de un paciente
router.get('/paciente/:pacienteId', desparacitacionController.getDesparacitacionesByPaciente);

// GET /api/v1/desparacitacion/:id - Obtener una desparacitacion por ID
router.get('/:id', desparacitacionController.getDesparacitacionById);

// POST /api/v1/desparacitacion - Crear nueva desparacitacion
router.post(
  '/',
  [
    body('producto').notEmpty().withMessage('El producto es requerido').isLength({ max: 55 }).withMessage('Producto no debe exceder 55 caracteres'),
    body('fecha_aplicada').notEmpty().withMessage('La fecha de aplicación es requerida').isISO8601().withMessage('Fecha de aplicación debe ser una fecha válida'),
    body('pacientes_id_mascota').notEmpty().withMessage('El ID de mascota es requerido').isInt().withMessage('ID de mascota debe ser un número entero'),
    body('proxima_dosis').optional().isISO8601().withMessage('Próxima dosis debe ser una fecha válida'),
    handleValidationErrors
  ],
  desparacitacionController.createDesparacitacion
);

// PUT /api/v1/desparacitacion/:id - Actualizar desparacitacion
router.put(
  '/:id',
  [
    body('producto').optional().isLength({ max: 55 }).withMessage('Producto no debe exceder 55 caracteres'),
    body('fecha_aplicada').optional().isISO8601().withMessage('Fecha de aplicación debe ser una fecha válida'),
    body('proxima_dosis').optional().isISO8601().withMessage('Próxima dosis debe ser una fecha válida'),
    body('pacientes_id_mascota').optional().isInt().withMessage('ID de mascota debe ser un número entero'),
    handleValidationErrors
  ],
  desparacitacionController.updateDesparacitacion
);

// DELETE /api/v1/desparacitacion/:id - Eliminar desparacitacion
router.delete('/:id', desparacitacionController.deleteDesparacitacion);

module.exports = router;
