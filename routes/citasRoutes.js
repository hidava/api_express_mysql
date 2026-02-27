/**
 * Rutas para Citas
 */
const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citasController');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// GET /api/v1/citas/list - Listar todas las citas
router.get('/list',
  citasController.getAllCitas
);

// GET /api/v1/citas/propietario/:cedula - Obtener citas de un propietario
router.get('/propietario/:cedula',
  citasController.getCitasByPropietario
);

// GET /api/v1/citas/paciente/:id - Obtener citas de un paciente
router.get('/paciente/:id',
  citasController.getCitasByPaciente
);

// GET /api/v1/citas/fecha/:fecha - Obtener citas de una fecha
router.get('/fecha/:fecha',
  citasController.getCitasByFecha
);

// GET /api/v1/citas/horarios/:fecha - Obtener horarios disponibles para una fecha
router.get('/horarios/:fecha',
  citasController.getHorariosDisponibles
);

// GET /api/v1/citas/:id - Obtener una cita por ID
router.get('/:id',
  citasController.getCitaById
);

// POST /api/v1/citas - Crear una nueva cita
router.post('/',
  body('propietarios_cedula')
    .exists().withMessage('propietarios_cedula es requerido')
    .isInt().withMessage('propietarios_cedula debe ser un número'),
  body('pacientes_id_mascota')
    .exists().withMessage('pacientes_id_mascota es requerido')
    .isInt().withMessage('pacientes_id_mascota debe ser un número'),
  body('fecha_cita')
    .exists().withMessage('fecha_cita es requerido')
    .isISO8601().withMessage('fecha_cita debe ser una fecha válida (YYYY-MM-DD)'),
  body('hora_cita')
    .exists().withMessage('hora_cita es requerido')
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('hora_cita debe tener formato HH:MM o HH:MM:SS'),
  body('descripcion')
    .optional()
    .isLength({ min: 5 }).withMessage('descripcion debe tener al menos 5 caracteres'),
  body('sede')
    .optional()
    .isLength({ min: 3 }).withMessage('sede debe tener al menos 3 caracteres'),
  handleValidationErrors,
  citasController.createCita
);

// PUT /api/v1/citas/:id - Actualizar una cita
router.put('/:id',
  body('propietarios_cedula')
    .optional()
    .isInt().withMessage('propietarios_cedula debe ser un número'),
  body('pacientes_id_mascota')
    .optional()
    .isInt().withMessage('pacientes_id_mascota debe ser un número'),
  body('fecha_cita')
    .optional()
    .isISO8601().withMessage('fecha_cita debe ser una fecha válida (YYYY-MM-DD)'),
  body('hora_cita')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('hora_cita debe tener formato HH:MM o HH:MM:SS'),
  body('estado')
    .optional()
    .isIn(['pendiente', 'confirmada', 'cancelada', 'completada']).withMessage('estado debe ser: pendiente, confirmada, cancelada o completada'),
  body('descripcion')
    .optional()
    .isLength({ min: 5 }).withMessage('descripcion debe tener al menos 5 caracteres'),
  handleValidationErrors,
  citasController.updateCita
);

// DELETE /api/v1/citas/:id - Eliminar una cita
router.delete('/:id',
  citasController.deleteCita
);

module.exports = router;
