#!/usr/bin/env python3
"""
Script para verificar usuarios en la base de datos
"""
import sys
import os
import hashlib

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from backend.app.core.config import settings

def verificar_usuarios():
    """Verificar usuarios en la base de datos"""
    
    try:
        # Crear conexión a la base de datos
        engine = create_engine(settings.database_url)
        
        with engine.connect() as connection:
            # Primero verificar la estructura de la tabla
            result = connection.execute(text("DESCRIBE usuarios"))
            print("📋 Estructura de la tabla usuarios:")
            for row in result.fetchall():
                print(f"  {row[0]} - {row[1]}")
            
            print("\n👥 Usuarios en la base de datos:")
            # Verificar usuarios con columnas básicas
            result = connection.execute(text("""
                SELECT id, email, activo
                FROM usuarios 
                ORDER BY id
            """))
            
            for row in result.fetchall():
                print(f"  ID: {row[0]}, Email: {row[1]}, Activo: {row[2]}")
                
    except Exception as e:
        print(f"❌ Error al verificar usuarios: {e}")

if __name__ == "__main__":
    verificar_usuarios()