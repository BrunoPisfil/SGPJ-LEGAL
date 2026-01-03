# Sistema de Gestión de Sesiones Expiradas

## 📋 Descripción

Este sistema detecta automáticamente cuando una sesión del usuario ha expirado, ya sea por:
1. **Inactividad** - El usuario está inactivo más de 30 minutos
2. **Error 401** - El servidor retorna "Not authenticated"

Cuando cualquiera de estos eventos ocurre, se muestra un diálogo amigable indicando al usuario que su sesión ha expirado y ofrece un botón para volver al login.

## 🔧 Componentes

### 1. `hooks/use-inactivity-timeout.ts`
Hook que detecta inactividad del usuario.

**Características:**
- Monitorea eventos de usuario: `mousedown`, `keydown`, `scroll`, `touchstart`, `click`
- Timeout configurable (default: 30 minutos)
- Callback cuando se alcanza el timeout
- Funciones para resetear y obtener tiempo de inactividad

**Uso:**
```typescript
useInactivityTimeout({
  timeout: 30 * 60 * 1000, // 30 minutos
  events: ['mousedown', 'keydown', 'scroll'],
  onTimeout: () => {
    console.log('Usuario inactivo');
  },
});
```

### 2. `lib/api.ts` - Mejorado
El cliente API ahora detecta errores 401 y ejecuta un callback.

**Cambios:**
- Función `setUnauthorizedHandler()` para registrar callback de error 401
- Detección de status 401 en respuestas
- Limpieza automática del token en caso de error 401

**Uso:**
```typescript
setUnauthorizedHandler(() => {
  // Manejar error 401
});
```

### 3. `hooks/use-auth.tsx` - Mejorado
Contexto de autenticación con soporte para sesiones expiradas.

**Nuevas propiedades:**
- `sessionExpired: boolean` - Si la sesión ha expirado
- `sessionExpiredReason: 'inactivity' | 'unauthorized'` - Razón de expiración
- `clearSessionExpired(): void` - Limpiar estado de sesión expirada

### 4. `components/session-expired-dialog.tsx`
Diálogo elegante que se muestra cuando la sesión expira.

**Props:**
- `open: boolean` - Si el diálogo está visible
- `onOpenChange: (open: boolean) => void` - Callback al cambiar estado
- `reason?: 'inactivity' | 'unauthorized'` - Tipo de expiración (para personalizar mensaje)

**Características:**
- Muestra mensaje diferente según la razón
- Botón para ir al login (redirige a `/login`)
- Botón cancelar (cierra el diálogo)

### 5. `components/session-expired-handler.tsx`
Componente orquestador que conecta todo.

**Responsabilidades:**
- Monitorea inactividad
- Escucha eventos de sesión expirada del contexto de auth
- Muestra/oculta el diálogo
- Solo activa si el usuario está autenticado

## 🔄 Flujo de Funcionamiento

### Escenario 1: Inactividad
```
Usuario inactivo por 30 min
    ↓
useInactivityTimeout dispara callback
    ↓
SessionExpiredHandler detecta y muestra diálogo
    ↓
Usuario hace clic en "Ir al Login"
    ↓
Se ejecuta logout() y redirige a /login
```

### Escenario 2: Error 401
```
Usuario hace request con sesión expirada
    ↓
API retorna 401 (Not authenticated)
    ↓
APIClient detecta 401 y ejecuta setUnauthorizedHandler
    ↓
AuthProvider.handleSessionExpired() se ejecuta
    ↓
SessionExpiredHandler ve sessionExpired=true
    ↓
Muestra diálogo con razón "unauthorized"
```

## 🎯 Configuración

### Cambiar tiempo de inactividad
En `components/session-expired-handler.tsx`:
```typescript
useInactivityTimeout({
  timeout: 15 * 60 * 1000, // 15 minutos
  // ...
});
```

### Cambiar eventos de actividad
Agregar más eventos que reseteen el timer:
```typescript
useInactivityTimeout({
  events: ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'input'],
  // ...
});
```

### Personalizar mensajes del diálogo
En `components/session-expired-dialog.tsx`, editar las constantes `title` y `description`.

## 🧪 Pruebas

### Probar inactividad:
1. Inicia sesión
2. No interactúes por 30 minutos
3. Deberías ver el diálogo de sesión expirada

### Probar error 401:
1. Abre DevTools (F12)
2. Ve a Application → LocalStorage
3. Elimina el token `sgpj_token`
4. Intenta hacer cualquier request (cambiar página, etc.)
5. Deberías ver el diálogo de sesión no válida

## 📦 Dependencias

- React hooks: `useEffect`, `useState`, `useCallback`, `useContext`
- Next.js: `useRouter` para redirección
- UI Components: `Dialog`, `Button`, `DialogHeader`, `DialogTitle`, `DialogDescription`

## 🔐 Seguridad

- El token se limpia automáticamente en error 401
- No se expone información sensible en los mensajes de error
- Los callbacks se limpian correctamente en cleanup
- Los timeouts se cancelan al desmontar componentes

## 📝 Notas

- El hook `useInactivityTimeout` es reutilizable en otros contextos
- El sistema es agnóstico al tipo de autenticación (JWT, sessions, etc.)
- Los eventos de actividad son suficientemente variados para captar la mayoría de interacciones
