"""
Script para inicializar la base de datos con Alembic
"""
from alembic.config import Config
from alembic import command
import os

def init_database():
    """Inicializa Alembic y crea la primera migración"""
    
    # Configurar Alembic
    alembic_cfg = Config("alembic.ini")
    
    # Inicializar Alembic si no está inicializado
    if not os.path.exists("alembic"):
        print("Inicializando Alembic...")
        command.init(alembic_cfg, "alembic")
        print("✅ Alembic inicializado")
    
    # Crear migración automática
    print("Creando migración automática...")
    command.revision(alembic_cfg, autogenerate=True, message="Inicial: tablas del sistema legal")
    print("✅ Migración creada")
    
    # Aplicar migración
    print("Aplicando migración...")
    command.upgrade(alembic_cfg, "head")
    print("✅ Base de datos actualizada")

if __name__ == "__main__":
    init_database()