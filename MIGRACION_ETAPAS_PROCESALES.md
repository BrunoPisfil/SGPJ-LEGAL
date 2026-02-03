# Migraciones de BD requeridas para Etapas Procesales

## Agregar campos a tabla `procesos`

Ejecuta estos comandos SQL en tu base de datos remota:

```sql
-- Agregar columnas para etapa procesal y tipo de composición
ALTER TABLE procesos ADD COLUMN etapa_procesal ENUM('investigación_preparatoria', 'etapa_intermedia', 'juzgamiento') DEFAULT NULL AFTER estado_juridico;
ALTER TABLE procesos ADD COLUMN tipo_composicion ENUM('unipersonal', 'colegiado') DEFAULT NULL AFTER etapa_procesal;

-- Opcional: Agregar índices para búsquedas rápidas
CREATE INDEX idx_procesos_etapa ON procesos(etapa_procesal);
CREATE INDEX idx_procesos_composicion ON procesos(tipo_composicion);
```

## Explicación de los campos

### `etapa_procesal`
Representa la etapa actual del proceso penal:
- **investigación_preparatoria**: Etapa inicial donde se recopila evidencia
- **etapa_intermedia**: Etapa de revisión y determinación de cargos
- **juzgamiento**: Etapa de juicio oral y sentencia

### `tipo_composicion`
Representa la composición del tribunal (solo aplica para etapa intermedia y juzgamiento):
- **unipersonal**: Un juez
- **colegiado**: Panel de tres jueces (Corte Superior)

## Validaciones aplicadas

- `tipo_composicion` **SOLO** es relevante cuando `etapa_procesal` es "etapa_intermedia"
- En "investigación_preparatoria" y "juzgamiento", el campo `tipo_composicion` debe ser NULL
- Ambos campos son opcionales (pueden ser NULL)

## Comportamiento esperado en la UI

1. **Proceso Penal**: Al crear un proceso penal, aparecen los selectores:
   - **Etapa Procesal**: Obligatorio de seleccionar (investigación preparatoria, etapa intermedia, juzgamiento)
   - **Tipo de Composición**: **SOLO aparece cuando se selecciona "Etapa Intermedia"**

2. **Proceso Civil**: Estos campos NO aparecen (no aplican para procesos civiles)

## Cambios realizados en el código

### Backend (Python/FastAPI)

1. **Modelo**: `backend/app/models/proceso.py`
   - Agregados campos `etapa_procesal` y `tipo_composicion`

2. **Schemas**: `backend/app/schemas/proceso.py`
   - Enums: `EtapaProcedural` y `TipoComposicion`
   - Validación: `tipo_composicion` solo es válido para etapa_intermedia
   - Aplicado en `ProcesoBase`, `ProcesoUpdate` y `ProcesoResponse`

3. **Endpoint**: `backend/app/api/v1/endpoints/procesos.py`
   - Función `proceso_to_response()` incluye estos campos en la respuesta

### Frontend (TypeScript/React)

1. **Librería**: `lib/etapas-procesales.ts`
   - Constantes y enums para etapas y tipos de composición
   - Función `getOpcionesTipoComposicion()` para cascada de selección
   - Función `esValidoTipoComposicion()` para validación

2. **Tipos**: `lib/procesos.ts`
   - Agregados tipos `EtapaProcesalType` y `TipoComposicionType`
   - Actualizados interfaces `Proceso`, `ProcesoCreate`, `ProcesoUpdate`

3. **Formulario**: `app/(app)/procesos/nuevo/page.tsx`
   - Selectores en cascada: Etapa → (Si es Etapa Intermedia) → Tipo de Composición
   - Los campos solo aparecen para procesos penales
   - Validación en cliente

## Próximos pasos

1. Ejecuta los comandos SQL en tu BD remota
2. Redeploy de backend para aplicar los cambios
3. Los cambios en frontend se aplicarán automáticamente
4. Prueba creando un nuevo proceso penal

