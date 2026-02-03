# Cambios en Procesos Penales - UI

## Resumen de cambios

### 1. **Roles Procesales - Denunciante/Denunciado** ✅
- **Procesos Civiles**: Demandante / Demandado
- **Procesos Penales**: Denunciante / Denunciado

El formulario ahora muestra automáticamente las opciones correctas según el tipo de proceso seleccionado.

### 2. **Juzgado Penal en Modal de Instancias** ✅
**En el modal/diálogo de Seleccionar Juzgado:**
- Cuando selecciona un **Distrito Judicial**, en el campo **"Instancia"** aparece ahora la opción **"Juzgado Penal"**
- Cuando selecciona **"Juzgado Penal"**, el campo de **"Especialidad" se oculta** (porque juzgado penal no tiene especialidades)
- Puede seleccionar "Juzgado Penal" directamente después de seleccionar distrito

### 3. **Selector de Juez/Especialista** ✅
- El selector de **Juez/Especialista sigue siendo visible para AMBOS tipos de procesos**
- Aparece tanto en civiles como en penales en el formulario principal
- No fue removido, sigue funcionando normalmente

## Flujo en la UI

### Modal de Seleccionar Juzgado (Para ambos tipos)

```
[Distrito Judicial] → Selecciona cualquier distrito
  ↓
[Instancia] → Muestra opciones:
  ├─ Juzgado de Primera Instancia
  ├─ Juzgado de Segunda Instancia
  ├─ Juzgado Penal ← NUEVO
  └─ ...otras instancias
  ↓
Si selecciona "Juzgado Penal":
  → [Especialidad] SE OCULTA (no es necesaria)
  → [Juzgado] Muestra "Juzgado Penal"

Si selecciona otra instancia:
  → [Especialidad] APARECE (como antes)
  → [Juzgado] Muestra lista con juzgados de esa especialidad
```

## Archivos Modificados

### `components/juzgado-selector.tsx` ✅
- **`cargarInstancias()`**: Ahora agrega "Juzgado Penal" (ID 999) a la lista de instancias
- **Selector de Especialidad**: Se oculta cuando `selectedInstancia === "999"`
- **useEffect buscar juzgados**: Maneja el caso especial de Juzgado Penal sin necesidad de especialidad
- **Lista de Juzgados**: Condición actualizada: `selectedEspecialidad || selectedInstancia === "999"`

### `app/(app)/procesos/nuevo/page.tsx` ✅
- Cambios de UI para Denunciante/Denunciado
- **El selector de Juez/Especialista SE MANTIENE** en ambos tipos de procesos
- El selector de Juzgado sigue siendo normal (abre el modal)

## Detalles Técnicos

### Juzgado Penal Virtual
Cuando se selecciona "Juzgado Penal" (ID 999), el sistema crea un objeto:
```javascript
{
  id: 999,
  nombre: "Juzgado Penal",
  distrito_judicial: "Seleccionado",
  direccion: "Juzgado Penal",
  telefono: "",
  email: ""
}
```

### Lógica de Instancias
- Las instancias normales vienen de la API
- "Juzgado Penal" se agrega localmente en el front (ID especial 999)
- Cuando se selecciona, se omite la búsqueda de especialidades

## Comportamiento esperado

✅ Usuario selecciona **"Seleccionar Juzgado"** → Se abre modal
  ↓
✅ Selecciona un **Distrito Judicial**
  ↓
✅ En **Instancia** ve "Juzgado Penal" como opción
  ↓
✅ Si selecciona "Juzgado Penal":
  - El campo **Especialidad desaparece**
  - Se muestra "Juzgado Penal" en la lista
  - Puede hacer clic para seleccionar
  ↓
✅ El Juez/Especialista **sigue siendo seleccionable** normalmente en el formulario

## Notas

- No hay cambios en el backend
- El modal funciona para civiles y penales
- El Juez/Especialista es un campo aparte e independiente
- La lógica de Juzgado Penal es completamente en el frontend
