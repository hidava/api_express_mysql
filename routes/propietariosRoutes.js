const express = require('express');
const router = express.Router();
const propietarioController = require('../controllers/propietarioController');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// POST /api/v1/propietarios/check
router.post('/check',
  body('cedula').exists().withMessage('La cédula es requerida').trim().isLength({ min: 3 }).withMessage('Cédula inválida'),
  handleValidationErrors,
  propietarioController.checkCedula
);

module.exports = router;
