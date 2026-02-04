# Ejemplos de Uso - Módulo de Diligencias

## 📚 Ejemplos de API

### 1. Crear una Diligencia

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/diligencias \
  -H "Content-Type: application/json" \
  -d '{
    "proceso_id": 1,
    "titulo": "Presentación de demanda",
    "motivo": "Iniciar procedimiento civil para cobro de deuda",
    "fecha": "2024-12-25",
    "hora": "10:30:00",
    "descripcion": "Presentación ante juzgado civil",
    "notificar": true
  }'
```

**Response (201):**
```json
{
  "id": 1,
  "proceso_id": 1,
  "titulo": "Presentación de demanda",
  "motivo": "Iniciar procedimiento civil para cobro de deuda",
  "fecha": "2024-12-25",
  "hora": "10:30:00",
  "descripcion": "Presentación ante juzgado civil",
  "estado": "pendiente",
  "notificar": true,
  "notificacion_enviada": false,
  "created_at": "2024-12-20T15:30:45",
  "updated_at": "2024-12-20T15:30:45"
}
```

### 2. Listar Todas las Diligencias

**Request:**
```bash
curl http://localhost:8000/api/v1/diligencias?skip=0&limit=100
```

**Response (200):**
```json
[
  {
    "id": 1,
    "proceso_id": 1,
    "titulo": "Presentación de demanda",
    "fecha": "2024-12-25",
    "hora": "10:30:00",
    "estado": "pendiente",
    "notificar": true,
    "notificacion_enviada": false,
    "created_at": "2024-12-20T15:30:45"
  },
  {
    "id": 2,
    "proceso_id": 1,
    "titulo": "Audiencia preliminar",
    "fecha": "2025-01-15",
    "hora": "14:00:00",
    "estado": "pendiente",
    "notificar": true,
    "notificacion_enviada": false,
    "created_at": "2024-12-20T16:45:12"
  }
]
```

### 3. Obtener Diligencias de un Proceso

**Request:**
```bash
curl http://localhost:8000/api/v1/diligencias/proceso/1?skip=0&limit=100
```

**Response (200):**
```json
[
  {
    "id": 1,
    "proceso_id": 1,
    "titulo": "Presentación de demanda",
    "fecha": "2024-12-25",
    "hora": "10:30:00",
    "estado": "pendiente",
    "notificar": true,
    "notificacion_enviada": false,
    "created_at": "2024-12-20T15:30:45"
  }
]
```

### 4. Obtener una Diligencia Específica

**Request:**
```bash
curl http://localhost:8000/api/v1/diligencias/1
```

**Response (200):**
```json
{
  "id": 1,
  "proceso_id": 1,
  "titulo": "Presentación de demanda",
  "motivo": "Iniciar procedimiento civil para cobro de deuda",
  "fecha": "2024-12-25",
  "hora": "10:30:00",
  "descripcion": "Presentación ante juzgado civil",
  "estado": "pendiente",
  "notificar": true,
  "notificacion_enviada": false,
  "created_at": "2024-12-20T15:30:45",
  "updated_at": "2024-12-20T15:30:45"
}
```

### 5. Actualizar una Diligencia

**Request:**
```bash
curl -X PUT http://localhost:8000/api/v1/diligencias/1 \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Presentación de demanda - ACTUALIZADO",
    "estado": "completada",
    "descripcion": "Presentación realizada exitosamente"
  }'
```

**Response (200):**
```json
{
  "id": 1,
  "proceso_id": 1,
  "titulo": "Presentación de demanda - ACTUALIZADO",
  "motivo": "Iniciar procedimiento civil para cobro de deuda",
  "fecha": "2024-12-25",
  "hora": "10:30:00",
  "descripcion": "Presentación realizada exitosamente",
  "estado": "completada",
  "notificar": true,
  "notificacion_enviada": false,
  "created_at": "2024-12-20T15:30:45",
  "updated_at": "2024-12-20T16:45:12"
}
```

### 6. Eliminar una Diligencia

**Request:**
```bash
curl -X DELETE http://localhost:8000/api/v1/diligencias/1
```

**Response (204):**
```
(no content)
```

---

## 💻 Ejemplos de Frontend (TypeScript)

### 1. Crear Diligencia desde React

```typescript
import { diligenciasAPI } from '@/lib/diligencias';
import { useState } from 'react';

export function CrearDiligencia() {
  const [cargando, setCargando] = useState(false);

  const handleCrear = async () => {
    setCargando(true);
    try {
      const nueva = await diligenciasAPI.crear({
        proceso_id: 1,
        titulo: 'Presentación de demanda',
        motivo: 'Cobro de deuda',
        fecha: '2024-12-25',
        hora: '10:30:00',
        notificar: true
      });
      console.log('Diligencia creada:', nueva);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <button onClick={handleCrear} disabled={cargando}>
      {cargando ? 'Creando...' : 'Crear Diligencia'}
    </button>
  );
}
```

### 2. Listar Diligencias

```typescript
import { diligenciasAPI, Diligencia } from '@/lib/diligencias';
import { useEffect, useState } from 'react';

export function ListaDiligencias() {
  const [diligencias, setDiligencias] = useState<Diligencia[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const datos = await diligenciasAPI.obtenerTodas();
        setDiligencias(datos);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  if (cargando) return <div>Cargando...</div>;

  return (
    <ul>
      {diligencias.map(d => (
        <li key={d.id}>
          {d.titulo} - {d.fecha} {d.hora}
        </li>
      ))}
    </ul>
  );
}
```

### 3. Filtrar por Proceso

```typescript
import { diligenciasAPI } from '@/lib/diligencias';
import { useEffect, useState } from 'react';

export function DiligenciasPorProceso({ procesoId }: { procesoId: number }) {
  const [diligencias, setDiligencias] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      const datos = await diligenciasAPI.obtenerPorProceso(procesoId);
      setDiligencias(datos);
    };
    cargar();
  }, [procesoId]);

  return (
    <div>
      <h3>Diligencias del Proceso {procesoId}</h3>
      <p>Total: {diligencias.length}</p>
    </div>
  );
}
```

### 4. Actualizar Estado

```typescript
import { diligenciasAPI } from '@/lib/diligencias';

async function marcarComoCompletada(diligenciaId: number) {
  const actualizada = await diligenciasAPI.actualizar(diligenciaId, {
    estado: 'completada'
  });
  console.log('Actualizada:', actualizada);
}
```

### 5. Eliminar Diligencia

```typescript
import { diligenciasAPI } from '@/lib/diligencias';

async function eliminar(diligenciaId: number) {
  if (confirm('¿Eliminar diligencia?')) {
    await diligenciasAPI.eliminar(diligenciaId);
    console.log('Eliminada');
  }
}
```

---

## 🎯 Flujos de Uso Típicos

### Flujo 1: Crear Proceso con Diligencias

```typescript
// 1. Crear proceso
const proceso = await procesosAPI.crear({ /* ... */ });

// 2. Crear diligencias asociadas
await diligenciasAPI.crear({
  proceso_id: proceso.id,
  titulo: 'Primera diligencia',
  motivo: '...',
  fecha: '2024-12-25',
  hora: '10:00:00'
});

// 3. El sistema enviará notificación automáticamente 24h antes
```

### Flujo 2: Actualizar Estado de Diligencia

```typescript
// 1. Obtener diligencia
const diligencia = await diligenciasAPI.obtener(1);

// 2. Ver estado actual
console.log(diligencia.estado); // "pendiente"

// 3. Marcar como en progreso
await diligenciasAPI.actualizar(1, {
  estado: 'en_progreso'
});

// 4. Luego marcar como completada
await diligenciasAPI.actualizar(1, {
  estado: 'completada'
});
```

### Flujo 3: Gestionar Notificaciones

```typescript
// Crear sin notificación
await diligenciasAPI.crear({
  // ...
  notificar: false
});

// Editar para habilitar notificación
await diligenciasAPI.actualizar(1, {
  notificar: true
});

// Ver si fue notificada
const diligencia = await diligenciasAPI.obtener(1);
console.log(diligencia.notificacion_enviada); // true o false
```

---

## 🔔 Ejemplos de Notificaciones

### Notificación de Diligencia (Automática)

Cuando falten 24 horas:

**Email:**
```
Asunto: Recordatorio: Diligencia Presentación de demanda

Body:
Recordatorio automático: La diligencia 'Presentación de demanda' 
está programada para las 10:30 del 25/12/2024.

Motivo: Iniciar procedimiento civil para cobro de deuda
```

**En Sistema:**
```
Tipo: Recordatorio de Diligencia
Mensaje: La diligencia 'Presentación de demanda' está programada 
para las 10:30 del 25/12/2024. Motivo: Iniciar procedimiento civil 
para cobro de deuda
```

---

## 📊 Casos de Uso

### Caso 1: Seguimiento de Demanda

```
1. Crear proceso civil
2. Agregar diligencia: "Presentación de demanda" (fecha: hoy + 3 días)
   → Sistema notifica 24h antes
3. Agregar diligencia: "Audiencia de contestación" (fecha: hoy + 30 días)
   → Sistema notifica 24h antes
4. Actualizar estados según se ejecuten
5. Ver historial de todas las diligencias
```

### Caso 2: Proceso Penal con Múltiples Etapas

```
Investigación Preparatoria:
- Presentación de denuncia
- Período investigativo
- Recopilación de evidencia

Etapa Intermedia:
- Audiencia preliminar
- Acusación fiscal

Juzgamiento:
- Audiencia de juicio oral
- Resolución
```

Cada una con sus respectivas diligencias y notificaciones automáticas.

---

## ⚙️ Configuración Avanzada

### Cambiar Hora de Notificación

En `backend/app/core/config.py`:

```python
# Por defecto: 24 horas
audiencia_notification_hours: int = 24

# Para cambiar a 48 horas:
# audiencia_notification_hours: int = 48
```

### Cambiar Frecuencia de Verificación

En `backend/app/core/config.py`:

```python
# Por defecto: cada 10 minutos
notification_check_interval_minutes: int = 10

# Para cambiar a cada 5 minutos:
# notification_check_interval_minutes: int = 5
```

### Cambiar Email de Notificaciones

En `backend/app/core/config.py`:

```python
default_notification_email: str = "tu-email@example.com"
```

---

## 🐛 Troubleshooting

### Las notificaciones no se envían

1. Verificar que la diligencia tiene `notificar = true`
2. Verificar que el scheduler está activo
3. Revisar logs del backend
4. Confirmarse que la fecha es correcta

```sql
-- Ver diligencias pendientes de notificar
SELECT * FROM diligencias 
WHERE notificar = true 
AND notificacion_enviada = false;
```

### Email no se envía

1. Verificar configuración SMTP
2. Revisar logs del servicio de email
3. Validar email en `settings.default_notification_email`

### Diligencia no aparece en lista

1. Verificar que la consulta include el `proceso_id` correcto
2. Revisar que no esté eliminada
3. Verificar permisos/autenticación

---

## 📞 API Reference Rápida

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/diligencias` | Crear |
| GET | `/diligencias` | Listar todas |
| GET | `/diligencias/proceso/{id}` | Listar por proceso |
| GET | `/diligencias/{id}` | Obtener una |
| PUT | `/diligencias/{id}` | Actualizar |
| DELETE | `/diligencias/{id}` | Eliminar |

---

**Última actualización:** 2024
**Versión:** 1.0
