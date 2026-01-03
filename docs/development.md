# 🚀 Scripts de desarrollo para SGPJ Legal

## Frontend (Next.js)
```bash
# Instalar dependencias
pnpm install

# Desarrollo
pnpm dev

# Build para producción  
pnpm build

# Iniciar en producción
pnpm start
```

## Backend (FastAPI)
```bash
# Cambiar al directorio del backend
cd backend

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de MySQL

# Desarrollo con recarga automática
uvicorn main:app --reload

# Producción
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Base de datos
```bash
# Ejecutar el schema en MySQL
mysql -u root -p sgpj_legal < database/schema.sql

# O usando el cliente de MySQL
mysql -u root -p
CREATE DATABASE sgpj_legal;
USE sgpj_legal;
source database/schema.sql;
```

## Docker (Todo el stack)
```bash
cd backend
docker-compose up -d
```

## Scripts útiles

### Windows (PowerShell)
```powershell
# Iniciar frontend y backend simultáneamente
# Crear archivo start-dev.ps1:

# Terminal 1: Frontend
Start-Process powershell -ArgumentList "-Command", "pnpm dev"

# Terminal 2: Backend  
Start-Process powershell -ArgumentList "-Command", "cd backend; uvicorn main:app --reload"
```

### Linux/Mac (Bash)
```bash
# Crear archivo start-dev.sh:
#!/bin/bash

# Iniciar frontend en background
pnpm dev &

# Iniciar backend
cd backend && uvicorn main:app --reload &

# Esperar por ambos procesos
wait
```