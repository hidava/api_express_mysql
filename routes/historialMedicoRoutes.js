/**
 * Rutas para Historial Médico
 * Endpoints: /api/v1/historial-medico
 */
const express = require('express');
const router = express.Router();
const historialMedicoController = require('../controllers/historialMedicoController');
const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

/**
 * @route   POST /api/v1/historial-medico
 * @desc    Crear un nuevo registro de historial médico
 * @access  Public (agregar autenticación si es necesario)
 */
router.post(
  '/',
  [
    body('motivo_consulta')
      .exists().withMessage('El motivo de consulta es obligatorio')
      .isString().withMessage('El motivo debe ser texto')
      .trim()
      .notEmpty().withMessage('El motivo no puede estar vacío'),
    body('pacientes_id_mascota')
      .exists().withMessage('El ID del paciente es obligatorio')
      .isInt({ min: 1 }).withMessage('El ID del paciente debe ser un número válido'),
    body('diagnostico')
      .optional()
      .isString().withMessage('El diagnóstico debe ser texto'),
    body('tratamiento')
      .optional()
      .isString().withMessage('El tratamiento debe ser texto'),
    body('imagen_url')
      .optional()
      .isString().withMessage('La URL de imagen debe ser texto'),
    body('imagen_name')
      .optional()
      .isString().withMessage('El nombre de imagen debe ser texto'),
    handleValidationErrors
  ],
  historialMedicoController.createHistorial
);

/**
 * @route   GET /api/v1/historial-medico
 * @desc    Obtener todos los historiales médicos
 * @query   ?vista=true (opcional): devuelve vista completa con propietarios
 * @query   ?paciente_id=N (opcional): filtra por paciente
 * @query   ?historial_id=N (opcional): obtiene un historial específico
 * @access  Public
 */
router.get(
  '/',
  [
    query('vista').optional().isString(),
    query('paciente_id').optional().isInt({ min: 1 }).withMessage('El ID del paciente debe ser un número válido'),
    query('historial_id').optional().isInt({ min: 1 }).withMessage('El ID del historial debe ser un número válido'),
    handleValidationErrors
  ],
  historialMedicoController.getAllHistoriales
);

/**
 * @route   GET /api/v1/historial-medico/:id
 * @desc    Obtener un historial médico por ID
 * @access  Public
 */
router.get(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('El ID debe ser un número válido'),
    handleValidationErrors
  ],
  historialMedicoController.getHistorialById
);

/**
 * @route   GET /api/v1/historial-medico/paciente/:pacienteId
 * @desc    Obtener todos los historiales médicos de un paciente
 * @access  Public
 */
router.get(
  '/paciente/:pacienteId',
  [
    param('pacienteId').isInt({ min: 1 }).withMessage('El ID del paciente debe ser un número válido'),
    handleValidationErrors
  ],
  historialMedicoController.getHistorialesByPaciente
);

/**
 * @route   PUT /api/v1/historial-medico/:id
 * @desc    Actualizar un historial médico
 * @access  Public (agregar autenticación si es necesario)
 */
router.put(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('El ID debe ser un número válido'),
    body('motivo_consulta')
      .optional()
      .isString().withMessage('El motivo debe ser texto')
      .trim()
      .notEmpty().withMessage('El motivo no puede estar vacío'),
    body('diagnostico')
      .optional()
      .isString().withMessage('El diagnóstico debe ser texto'),
    body('tratamiento')
      .optional()
      .isString().withMessage('El tratamiento debe ser texto'),
    body('imagen_url')
      .optional()
      .isString().withMessage('La URL de imagen debe ser texto'),
    body('imagen_name')
      .optional()
      .isString().withMessage('El nombre de imagen debe ser texto'),
    handleValidationErrors
  ],
  historialMedicoController.updateHistorial
);

/**
 * @route   DELETE /api/v1/historial-medico/:id
 * @desc    Eliminar un historial médico
 * @access  Public (agregar autenticación si es necesario)
 */
router.delete(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('El ID debe ser un número válido'),
    handleValidationErrors
  ],
  historialMedicoController.deleteHistorial
);

module.exports = router;
