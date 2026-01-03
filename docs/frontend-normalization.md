# Adaptación del Frontend para Estructura Normalizada

## Resumen de Cambios

El frontend ha sido actualizado para funcionar con la nueva estructura de base de datos normalizada, manteniendo compatibilidad hacia atrás con el código existente.

## Cambios en la Base de Datos

### Estructura Anterior
```sql
procesos (
  demandante VARCHAR,      -- Texto libre
  demandado VARCHAR,       -- Texto libre  
  juzgado VARCHAR,         -- Texto libre
  juez VARCHAR            -- Texto libre
)
```

### Nueva Estructura Normalizada
```sql
procesos (
  juzgado_id INT,         -- FK a tabla juzgados
  especialista_id INT     -- FK a tabla especialistas (jueces)
)

partes_proceso (
  proceso_id INT,         -- FK a procesos
  parte_nombre VARCHAR,   -- Nombre de la parte
  parte_rol ENUM('demandante', 'demandado'),
  es_cliente BOOLEAN      -- Si es nuestro cliente
)

juzgados (
  id INT,
  nombre VARCHAR
)

especialistas (
  id INT, 
  nombre VARCHAR,
  cargo VARCHAR
)
```

## Cambios en las Interfaces TypeScript

### Interface `Proceso` Actualizada

```typescript
export interface Proceso {
  id: number;
  expediente: string;
  tipo: TipoProceso;
  materia: string;
  
  // Nuevos campos normalizados
  demandantes: string[];      // Array de nombres
  demandados: string[];       // Array de nombres
  juzgado_nombre: string;     // Nombre del juzgado
  juez_nombre?: string;       // Nombre del juez
  
  // Campos de compatibilidad (computados)
  demandante?: string;        // Primer demandante para compatibilidad
  demandado?: string;         // Primer demandado para compatibilidad
  juzgado?: string;           // Alias para juzgado_nombre
  juez?: string;              // Alias para juez_nombre
  
  estado: EstadoProceso;
  monto_pretension?: number;
  fecha_inicio: string;
  fecha_notificacion?: string;
  fecha_ultima_revision?: string;
  observaciones?: string;
  abogado_responsable_id: number;
  created_at: string;
  updated_at?: string;
}
```

## Función de Transformación

Se creó la función `transformProceso()` que automáticamente convierte los datos de la API normalizada al formato esperado por el frontend:

```typescript
export function transformProceso(proceso: any): Proceso {
  return {
    ...proceso,
    // Propiedades computadas para compatibilidad
    demandante: proceso.demandantes?.[0] || 'Sin demandante',
    demandado: proceso.demandados?.[0] || 'Sin demandado', 
    juzgado: proceso.juzgado_nombre || 'Sin juzgado',
    juez: proceso.juez_nombre || undefined
  };
}
```

## Archivos Modificados

### 1. `lib/procesos.ts`
- ✅ Actualizada interfaz `Proceso`
- ✅ Agregada función `transformProceso()`
- ✅ Todas las funciones de API ahora transforman automáticamente los datos

### 2. `app/(app)/procesos/page.tsx`
- ✅ Corregido manejo de campos opcionales en filtros de búsqueda

### 3. `components/process-selector.tsx`
- ✅ Corregido manejo de campos opcionales en filtros de búsqueda

### 4. `components/process-selector-finance.tsx`
- ✅ Actualizada data de muestra con nueva estructura
- ✅ Corregido manejo de campos opcionales en filtros

## Compatibilidad

### ✅ Lo que sigue funcionando igual:
- Todas las vistas existentes de procesos
- Búsquedas por demandante/demandado/juzgado
- Selectores de procesos
- Formularios existentes

### 🆕 Nuevas capacidades:
- Soporte para múltiples demandantes por proceso
- Soporte para múltiples demandados por proceso
- Referencias normalizadas a juzgados y jueces
- Identificación de partes que son clientes nuestros

## Migración de Datos

Los datos existentes fueron migrados automáticamente:
- 5 procesos → 10 registros en `partes_proceso` (5 demandantes + 5 demandados)
- 5 juzgados normalizados de texto a FK
- 5 especialistas (jueces) normalizados de texto a FK

## Pruebas

Para verificar que todo funciona correctamente:

```bash
# En backend/
python test_frontend_compatibility.py
```

## Próximos Pasos

### Opcional - Aprovechar Nuevas Capacidades:
1. **Formularios de procesos**: Actualizar para permitir múltiples demandantes/demandados
2. **Vista de partes**: Crear interfaz para gestionar partes de proceso individualmente
3. **Filtros avanzados**: Filtrar por tipo de parte (cliente vs tercero)
4. **Reportes**: Generar reportes por cliente considerando todos sus procesos

### Mantenimiento:
- Los datos de muestra en `process-selector-finance.tsx` podrían reemplazarse por llamadas reales a la API cuando esté disponible en producción.

## Notas Técnicas

- La transformación es transparente para el código existente
- No se requieren cambios en componentes que solo leen datos
- Los formularios de creación/edición pueden seguir usando los campos simples
- La API se encarga de la normalización automáticamente