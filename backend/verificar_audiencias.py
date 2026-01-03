#!/usr/bin/env python3
"""
Script para verificar audiencias en la base de datos
"""
import sys
import os

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings

def verificar_audiencias():
    """Verificar audiencias en la base de datos"""
    
    try:
        # Crear conexión a la base de datos
        engine = create_engine(settings.database_url)
        
        with engine.connect() as connection:
            # Verificar estructura de la tabla
            print("📋 Estructura de la tabla audiencias:")
            result = connection.execute(text("DESCRIBE audiencias"))
            for row in result.fetchall():
                print(f"  {row[0]} - {row[1]}")
            
            print("\n📊 Audiencias en la base de datos:")
            # Contar audiencias
            result = connection.execute(text("SELECT COUNT(*) FROM audiencias"))
            total = result.fetchone()[0]
            print(f"Total de audiencias: {total}")
            
            if total > 0:
                # Mostrar algunas audiencias
                result = connection.execute(text("""
                    SELECT id, proceso_id, tipo, fecha, hora, sede 
                    FROM audiencias 
                    ORDER BY fecha DESC, hora DESC 
                    LIMIT 10
                """))
                
                print("\n🔍 Últimas 10 audiencias:")
                for row in result.fetchall():
                    print(f"  ID: {row[0]}, Proceso: {row[1]}, Tipo: {row[2]}, Fecha: {row[3]}, Hora: {row[4]}, Sede: {row[5]}")
                
                # Verificar si hay audiencias con IDs específicos
                result = connection.execute(text("SELECT MIN(id), MAX(id) FROM audiencias"))
                min_id, max_id = result.fetchone()
                print(f"\n📈 Rango de IDs: {min_id} - {max_id}")
                
    except Exception as e:
        print(f"❌ Error al verificar audiencias: {e}")

if __name__ == "__main__":
    verificar_audiencias()