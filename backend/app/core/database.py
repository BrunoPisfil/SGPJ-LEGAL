import pymysql
pymysql.install_as_MySQLdb()

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool, QueuePool
from app.core.config import settings

# En Vercel (serverless) usar NullPool — cada request abre y cierra su conexión
# En desarrollo usar QueuePool con límite conservador
is_serverless = os.getenv("VERCEL") in ("true", "1", "True")

engine_kwargs = dict(
    echo=settings.debug,
    pool_pre_ping=True,
    connect_args={"ssl": {}},
)

if is_serverless:
    # Serverless: sin pool, cada invocación gestiona su propia conexión
    engine_kwargs["poolclass"] = NullPool
else:
    # Desarrollo local: pool pequeño
    engine_kwargs["poolclass"] = QueuePool
    engine_kwargs["pool_size"] = 3
    engine_kwargs["max_overflow"] = 2
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(settings.database_url, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
