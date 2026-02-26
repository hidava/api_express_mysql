const express = require('express');
const router = express.Router();
const propietarioController = require('../controllers/propietarioController');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// GET /api/v1/propietarios - Obtener todos los propietarios
router.get('/', propietarioController.getAllPropietarios);

// GET /api/v1/propietarios/:cedula - Obtener un propietario
router.get('/:cedula', propietarioController.getPropietarioByCedula);

// PUT /api/v1/propietarios/:cedula - Actualizar propietario
router.put('/:cedula',
  body('nombre').optional().isLength({ min: 2 }).withMessage('Nombre inválido'),
  body('apellido').optional().isLength({ min: 2 }).withMessage('Apellido inválido'),
  body('telefono').optional().isLength({ min: 7 }).withMessage('Teléfono inválido'),
  body('direccion').optional().isLength({ min: 5 }).withMessage('Dirección inválida'),
  handleValidationErrors,
  propietarioController.updatePropietario
);

// DELETE /api/v1/propietarios/:cedula - Eliminar propietario
router.delete('/:cedula', propietarioController.deletePropietario);

// POST /api/v1/propietarios/check
router.post('/check',
  body('cedula').exists().withMessage('La cédula es requerida').trim().isLength({ min: 3 }).withMessage('Cédula inválida'),
  handleValidationErrors,
  propietarioController.checkCedula
);

module.exports = router;
