from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import settings

# Crear el engine de la base de datos
engine = create_engine(
    settings.database_url,
    echo=settings.debug,  # Log SQL queries en modo debug
    pool_pre_ping=True,   # Verificar conexiones antes de usarlas
    pool_recycle=300      # Reciclar conexiones cada 5 minutos
)

# Crear la clase SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Crear la clase Base para los modelos
Base = declarative_base()


def get_db():
    """Generador de sesiones de base de datos"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()