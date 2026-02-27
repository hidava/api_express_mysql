/**
 * Controlador para Citas
 */
const Cita = require('../models/Cita');
const Propietario = require('../models/Propietario');
const Paciente = require('../models/Paciente');

/**
 * Crea una nueva cita
 */
const createCita = async (req, res) => {
  try {
    const { propietarios_cedula, pacientes_id_mascota, fecha_cita, hora_cita, descripcion, sede } = req.body;

    // Validar campos requeridos
    if (!propietarios_cedula || !pacientes_id_mascota || !fecha_cita || !hora_cita) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: propietarios_cedula, pacientes_id_mascota, fecha_cita, hora_cita'
      });
    }

    // Verificar que el propietario existe
    const propietarioExiste = await Propietario.findByCedula(propietarios_cedula);
    if (!propietarioExiste) {
      return res.status(404).json({
        success: false,
        message: 'No existe propietario con esa cédula'
      });
    }

    // Verificar que la mascota existe y pertenece al propietario
    const mascotaExiste = await Paciente.findById(pacientes_id_mascota);
    if (!mascotaExiste) {
      return res.status(404).json({
        success: false,
        message: 'No existe mascota con ese ID'
      });
    }

    if (Number(mascotaExiste.propietarios_cedula) !== Number(propietarios_cedula)) {
      return res.status(400).json({
        success: false,
        message: 'La mascota no pertenece a ese propietario'
      });
    }

    // Validar que no sea una fecha pasada
    const fechaCita = new Date(fecha_cita);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaCita < hoy) {
      return res.status(400).json({
        success: false,
        message: 'No se pueden agendar citas en fechas pasadas'
      });
    }

    // Verificar disponibilidad: máximo 2 citas por hora
    const citasEnHora = await Cita.countByFechaHora(fecha_cita, hora_cita);
    if (citasEnHora >= 2) {
      return res.status(400).json({
        success: false,
        message: 'Ya hay 2 citas agendadas para esa hora. Por favor seleccione otro horario.'
      });
    }

    // Verificar disponibilidad: máximo 12 citas por día
    const citasEnDia = await Cita.countByFecha(fecha_cita);
    if (citasEnDia >= 12) {
      return res.status(400).json({
        success: false,
        message: 'Ya se alcanzó el límite de 12 citas para ese día. Por favor seleccione otra fecha.'
      });
    }

    // Crear la cita
    const result = await Cita.create({
      propietarios_cedula,
      pacientes_id_mascota,
      fecha_cita,
      hora_cita,
      descripcion,
      sede: sede || 'Patitas Felices Alajuela',
      estado: 'pendiente'
    });

    res.status(201).json({
      success: true,
      message: 'Cita registrada exitosamente',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error en createCita:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar la cita'
    });
  }
};

/**
 * Obtiene todas las citas
 */
const getAllCitas = async (req, res) => {
  try {
    const citas = await Cita.findAll();
    res.json({
      success: true,
      data: citas
    });
  } catch (error) {
    console.error('Error en getAllCitas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las citas'
    });
  }
};

/**
 * Obtiene una cita por ID
 */
const getCitaById = async (req, res) => {
  try {
    const { id } = req.params;
    const cita = await Cita.findById(id);

    if (!cita) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    res.json({
      success: true,
      data: cita
    });
  } catch (error) {
    console.error('Error en getCitaById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la cita'
    });
  }
};

/**
 * Obtiene citas por cédula de propietario
 */
const getCitasByPropietario = async (req, res) => {
  try {
    const { cedula } = req.params;
    const citas = await Cita.findByPropietario(cedula);

    res.json({
      success: true,
      data: citas
    });
  } catch (error) {
    console.error('Error en getCitasByPropietario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las citas del propietario'
    });
  }
};

/**
 * Obtiene citas por ID de paciente
 */
const getCitasByPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const citas = await Cita.findByPaciente(id);

    res.json({
      success: true,
      data: citas
    });
  } catch (error) {
    console.error('Error en getCitasByPaciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las citas del paciente'
    });
  }
};

/**
 * Obtiene citas por fecha
 */
const getCitasByFecha = async (req, res) => {
  try {
    const { fecha } = req.params;
    const citas = await Cita.findByFecha(fecha);

    res.json({
      success: true,
      data: citas
    });
  } catch (error) {
    console.error('Error en getCitasByFecha:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las citas de la fecha'
    });
  }
};

/**
 * Obtiene horarios disponibles para una fecha
 */
const getHorariosDisponibles = async (req, res) => {
  try {
    const { fecha } = req.params;

    // Validar que no sea una fecha pasada
    const fechaCita = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaCita < hoy) {
      return res.status(400).json({
        success: false,
        message: 'No se pueden consultar fechas pasadas'
      });
    }

    // Verificar si ya se alcanzó el límite diario
    const citasEnDia = await Cita.countByFecha(fecha);
    if (citasEnDia >= 12) {
      return res.json({
        success: true,
        data: [],
        message: 'No hay horarios disponibles para esta fecha (límite alcanzado)'
      });
    }

    // Obtener todas las citas del día
    const citasDelDia = await Cita.findByFecha(fecha);

    // Generar horarios disponibles (de 9:00 AM a 6:00 PM, cada hora)
    const horarios = [];
    for (let hora = 9; hora <= 18; hora++) {
      const horaString = `${hora.toString().padStart(2, '0')}:00:00`;
      
      // Contar cuántas citas hay en esta hora
      const citasEnHora = citasDelDia.filter(cita => cita.hora_cita === horaString).length;
      
      // Si hay menos de 2 citas, el horario está disponible
      if (citasEnHora < 2) {
        horarios.push({
          hora: horaString,
          disponible: true,
          espacios_disponibles: 2 - citasEnHora
        });
      }
    }

    res.json({
      success: true,
      data: horarios,
      fecha: fecha,
      total_citas_dia: citasEnDia,
      limite_dia: 12
    });
  } catch (error) {
    console.error('Error en getHorariosDisponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener horarios disponibles'
    });
  }
};

/**
 * Actualiza una cita
 */
const updateCita = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar que la cita existe
    const citaExiste = await Cita.findById(id);
    if (!citaExiste) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    // Si se está cambiando el propietario, verificar que existe
    if (updateData.propietarios_cedula && updateData.propietarios_cedula !== citaExiste.propietarios_cedula) {
      const propietarioExiste = await Propietario.findByCedula(updateData.propietarios_cedula);
      if (!propietarioExiste) {
        return res.status(404).json({
          success: false,
          message: 'No existe propietario con esa cédula'
        });
      }
    }

    // Si se está cambiando la mascota, verificar que existe
    if (updateData.pacientes_id_mascota && updateData.pacientes_id_mascota !== citaExiste.pacientes_id_mascota) {
      const mascotaExiste = await Paciente.findById(updateData.pacientes_id_mascota);
      if (!mascotaExiste) {
        return res.status(404).json({
          success: false,
          message: 'No existe mascota con ese ID'
        });
      }
    }

    // Si se está cambiando la fecha/hora, validar disponibilidad
    if (updateData.fecha_cita || updateData.hora_cita) {
      const nuevaFecha = updateData.fecha_cita || citaExiste.fecha_cita;
      const nuevaHora = updateData.hora_cita || citaExiste.hora_cita;

      // Validar que no sea una fecha pasada
      const fechaCita = new Date(nuevaFecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaCita < hoy) {
        return res.status(400).json({
          success: false,
          message: 'No se pueden agendar citas en fechas pasadas'
        });
      }

      // Solo validar si cambió la fecha u hora
      if (nuevaFecha !== citaExiste.fecha_cita || nuevaHora !== citaExiste.hora_cita) {
        const citasEnHora = await Cita.countByFechaHora(nuevaFecha, nuevaHora);
        if (citasEnHora >= 2) {
          return res.status(400).json({
            success: false,
            message: 'Ya hay 2 citas agendadas para esa hora'
          });
        }

        const citasEnDia = await Cita.countByFecha(nuevaFecha);
        if (citasEnDia >= 12) {
          return res.status(400).json({
            success: false,
            message: 'Ya se alcanzó el límite de 12 citas para ese día'
          });
        }
      }
    }

    // Actualizar la cita
    const updated = await Cita.update(id, updateData);

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo actualizar la cita'
      });
    }

    res.json({
      success: true,
      message: 'Cita actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error en updateCita:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la cita'
    });
  }
};

/**
 * Elimina/cancela una cita
 */
const deleteCita = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la cita existe
    const citaExiste = await Cita.findById(id);
    if (!citaExiste) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    // Eliminar la cita
    const deleted = await Cita.delete(id);

    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo eliminar la cita'
      });
    }

    res.json({
      success: true,
      message: 'Cita eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteCita:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la cita'
    });
  }
};

module.exports = {
  createCita,
  getAllCitas,
  getCitaById,
  getCitasByPropietario,
  getCitasByPaciente,
  getCitasByFecha,
  getHorariosDisponibles,
  updateCita,
  deleteCita
};
