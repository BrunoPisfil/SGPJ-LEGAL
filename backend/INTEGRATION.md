# 🔗 Conexión Frontend ↔ Backend

## URLs de la API

**Desarrollo:**
- Backend: `http://localhost:8000`
- Documentación: `http://localhost:8000/docs`
- Endpoints API: `http://localhost:8000/api/v1/`

## Endpoints principales

### 🔐 Autenticación
```
POST /api/v1/auth/login
POST /api/v1/auth/register  
GET  /api/v1/auth/me
POST /api/v1/auth/refresh
```

### 📋 Procesos
```
GET    /api/v1/procesos/
POST   /api/v1/procesos/
GET    /api/v1/procesos/{id}
PUT    /api/v1/procesos/{id}
DELETE /api/v1/procesos/{id}
```

### 🏛️ Audiencias
```
GET    /api/v1/audiencias/
POST   /api/v1/audiencias/
GET    /api/v1/audiencias/{id}
PUT    /api/v1/audiencias/{id}
```

### 💰 Finanzas
```
GET /api/v1/finanzas/
GET /api/v1/finanzas/cobros
GET /api/v1/finanzas/pagos
```

### 📞 Directorio
```
GET    /api/v1/directorio/
POST   /api/v1/directorio/
GET    /api/v1/directorio/{id}
PUT    /api/v1/directorio/{id}
```

### 📊 Dashboard
```
GET /api/v1/dashboard/stats
GET /api/v1/dashboard/procesos-status
GET /api/v1/dashboard/audiencias-proximas
```

## Configuración en Next.js

### 1. Variables de entorno (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 2. Cliente HTTP (lib/api.ts)
```typescript
// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = {
  async get(endpoint: string, token?: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },

  async post(endpoint: string, data: any, token?: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // PUT, DELETE methods...
};
```

### 3. Hook de autenticación
```typescript
// hooks/useAuth.ts
import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    
    if (response.access_token) {
      setToken(response.access_token);
      setUser(response.user);
      localStorage.setItem('token', response.access_token);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return { user, token, login, logout };
}
```

## Iniciar el backend

### Opción 1: Desarrollo local
```bash
# 1. Instalar dependencias
pip install -r requirements.txt

# 2. Configurar .env
cp .env.example .env
# Editar .env con tus credenciales de MySQL

# 3. Iniciar servidor
uvicorn main:app --reload
```

### Opción 2: Con Docker
```bash
# Iniciar todo el stack (Backend + MySQL + phpMyAdmin)
docker-compose up -d

# Ver logs
docker-compose logs -f backend
```

## CORS ya configurado ✅

El backend ya tiene CORS configurado para tu frontend de Next.js:
- `http://localhost:3000` ✅
- `http://127.0.0.1:3000` ✅

## Testing

Prueba la conexión:
```bash
# Verificar que el backend esté corriendo
curl http://localhost:8000/health

# Probar login (después de crear usuario)
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```