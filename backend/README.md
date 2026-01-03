# SGPJ Legal - Backend API

Backend del Sistema de Gestión de Procesos Judiciales construido con FastAPI.

## Características

- 🚀 **FastAPI** - Framework moderno y rápido
- 🐘 **PostgreSQL** - Base de datos robusta
- 🔐 **JWT Authentication** - Autenticación segura
- 📝 **Auto-documentación** - Swagger UI integrado
- 🏗️ **Arquitectura limpia** - Separación de responsabilidades

## Instalación

1. Clona el repositorio
2. Instala las dependencias:
```bash
pip install -r requirements.txt
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
```

4. Ejecuta las migraciones:
```bash
alembic upgrade head
```

5. Inicia el servidor:
```bash
uvicorn main:app --reload
```

## Documentación

Una vez ejecutado, la documentación estará disponible en:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Estructura del proyecto

```
app/
├── api/           # Endpoints de la API
├── core/          # Configuración y seguridad  
├── models/        # Modelos de SQLAlchemy
├── schemas/       # Esquemas de Pydantic
├── services/      # Lógica de negocio
└── utils/         # Utilidades
```

## Endpoints principales

- `/api/v1/auth/*` - Autenticación
- `/api/v1/procesos/*` - Gestión de procesos
- `/api/v1/audiencias/*` - Gestión de audiencias
- `/api/v1/finanzas/*` - Gestión financiera
- `/api/v1/directorio/*` - Directorio de contactos