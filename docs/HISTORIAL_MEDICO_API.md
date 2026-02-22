# API de Historial Médico - Documentación

## Configuración de la Base de Datos en la Nube

La API ahora está configurada para conectarse a **DigitalOcean MySQL**.

### Variables de Entorno (.env)
```env
NODE_ENV=production
DB_HOST=tu-host-de-digitalocean.db.ondigitalocean.com
DB_PORT=25060
DB_USER=tu_usuario
DB_PASSWORD=tu_password_aqui
DB_NAME=defaultdb
DB_CONN_LIMIT=10
```

**Nota:** Las credenciales reales deben estar en tu archivo `.env` local y **NUNCA** deben ser subidas a GitHub.

---

## Endpoints Disponibles

Base URL: `https://api-express-mysql-taupe.vercel.app/api/v1`

### 📋 **Historial Médico**

#### 1. Crear Historial Médico
**POST** `/historial-medico`

**Body (JSON):**
```json
{
  "motivo_consulta": "Dolor de estómago",
  "diagnostico": "Gastritis leve",
  "tratamiento": "Dieta blanda por 3 días",
  "pacientes_id_mascota": 3,
  "imagen_url": "https://example.com/image.jpg",
  "imagen_name": "radiografia.jpg"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Historial médico creado exitosamente",
  "insertId": 5
}
```

---

#### 2. Obtener Todos los Historiales
**GET** `/historial-medico`

**Query Parameters (opcionales):**
- `?vista=true` - Devuelve vista completa con información de propietarios
- `?paciente_id=3` - Filtra por ID de paciente
- `?historial_id=5` - Obtiene un historial específico

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "motivo_consulta": "Dolor de estómago",
      "diagnostico": "Gastritis leve",
      "tratamiento": "Dieta blanda",
      "imagen_url": "https://...",
      "imagen_name": "radiografia.jpg",
      "pacientes_id_mascota": 3,
      "paciente_nombre": "Raul"
    }
  ]
}
```

**Con vista completa** (`?vista=true`):
```json
{
  "success": true,
  "data": [
    {
      "cedula": "208320615",
      "nombre_propietario": "Juan",
      "apellido_propietario": "Pérez",
      "telefono": "555-1234",
      "direccion": "Calle 123",
      "pacientes_id_mascota": 3,
      "nombre_mascota": "Raul",
      "especie": "Perro",
      "raza": "Salchicha",
      "edad": 8,
      "peso": 5,
      "altura": 30,
      "historial_id": 1,
      "motivo_consulta": "Dolor de Estomago",
      "diagnostico": "Diarrea",
      "tratamiento": "2 gotas de manzanilla"
    }
  ]
}
```

---

#### 3. Obtener Historial por ID
**GET** `/historial-medico/:id`

**Ejemplo:** `/historial-medico/5`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "motivo_consulta": "Dolor de estómago",
    "diagnostico": "Gastritis leve",
    "tratamiento": "Dieta blanda",
    "imagen_url": null,
    "imagen_name": null,
    "pacientes_id_mascota": 3,
    "paciente_nombre": "Raul"
  }
}
```

---

#### 4. Obtener Historiales por Paciente
**GET** `/historial-medico/paciente/:pacienteId`

**Ejemplo:** `/historial-medico/paciente/3`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "motivo_consulta": "...", ... },
    { "id": 2, "motivo_consulta": "...", ... }
  ],
  "count": 2
}
```

---

#### 5. Actualizar Historial
**PUT** `/historial-medico/:id`

**Body (JSON):** (todos los campos son opcionales)
```json
{
  "motivo_consulta": "Dolor de estómago actualizado",
  "diagnostico": "Gastritis moderada",
  "tratamiento": "Medicamento + dieta",
  "imagen_url": "https://...",
  "imagen_name": "nueva_imagen.jpg"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Historial médico actualizado exitosamente",
  "affectedRows": 1,
  "data": {
    "id": 5,
    "motivo_consulta": "Dolor de estómago actualizado",
    ...
  }
}
```

---

#### 6. Eliminar Historial
**DELETE** `/historial-medico/:id`

**Ejemplo:** `/historial-medico/5`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Historial médico eliminado exitosamente",
  "affectedRows": 1
}
```

---

### 🐾 **Pacientes**

#### 7. Listar Todos los Pacientes
**GET** `/pacientes/list`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "nombre": "Raul",
      "especie": "Perro",
      "raza": "Salchicha",
      "edad": 8,
      "peso": 5,
      "altura": 30,
      "propietarios_cedula": "208320615",
      "fecha_creacion": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## 🔧 Instalación y Ejecución

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Crea o actualiza el archivo `.env` con las credenciales de DigitalOcean (ver arriba).

### 3. Iniciar el servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

El servidor estará disponible en: `http://localhost:3000`

---

## 🧪 Pruebas con cURL

### Crear historial médico
```bash
curl -X POST https://api-express-mysql-taupe.vercel.app/api/v1/historial-medico \
  -H "Content-Type: application/json" \
  -d '{
    "motivo_consulta": "Control de rutina",
    "diagnostico": "Saludable",
    "tratamiento": "Ninguno",
    "pacientes_id_mascota": 3
  }'
```

### Obtener todos los historiales
```bash
curl https://api-express-mysql-taupe.vercel.app/api/v1/historial-medico
```

### Obtener vista completa
```bash
curl "https://api-express-mysql-taupe.vercel.app/api/v1/historial-medico?vista=true"
```

### Listar pacientes
```bash
curl https://api-express-mysql-taupe.vercel.app/api/v1/pacientes/list
```

---

## 📊 Estructura de la Base de Datos

### Tabla: `historial_medico`
```sql
CREATE TABLE historial_medico (
    id INT AUTO_INCREMENT PRIMARY KEY,
    motivo_consulta TEXT NOT NULL,
    diagnostico TEXT,
    tratamiento TEXT,
    imagen_url VARCHAR(500),
    imagen_name VARCHAR(255),
    pacientes_id_mascota INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_historial_paciente FOREIGN KEY (pacientes_id_mascota) 
        REFERENCES pacientes(id_mascota) ON DELETE CASCADE
);
```

---

## ⚠️ Notas Importantes

1. **SSL Requerido**: La configuración SSL está habilitada en `config/database.js` para conexiones seguras a DigitalOcean.

2. **CORS**: La API acepta peticiones desde cualquier origen (`*`). En producción, configura dominios específicos.

3. **Validaciones**: Todos los endpoints tienen validación de entrada con `express-validator`.

4. **Relaciones**: 
   - Cada historial está vinculado a un paciente (`pacientes_id_mascota`)
   - Cada paciente está vinculado a un propietario (`propietarios_cedula`)
   - Las eliminaciones son en cascada

5. **Frontend**: Tu frontend Next.js debe configurar `NEXT_PUBLIC_API_URL=https://api-express-mysql-taupe.vercel.app/api/v1` en su `.env.local`

---

## 🚀 Deploy

La API está configurada para desplegarse en **Vercel**. Asegúrate de:

1. Configurar las variables de entorno en Vercel Dashboard
2. La URL base es: `https://api-express-mysql-taupe.vercel.app`
3. Endpoint completo ejemplo: `https://api-express-mysql-taupe.vercel.app/api/v1/historial-medico`

---

## 📞 Soporte

Para problemas o preguntas, revisa:
- Los logs del servidor: `npm run dev` muestra errores en consola
- Health check: `GET /health` para verificar conexión a BD
- Documentación API: `GET /docs`

---

**¡Listo!** 🎉 La API de Historial Médico está completamente funcional y conectada a la nube.
