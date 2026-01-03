#!/usr/bin/env python3
"""
Script para verificar el contenido de la tabla bitacora_procesos
"""
import sys
import os

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings

def verificar_bitacora():
    """Verificar el contenido de la tabla bitacora_procesos"""
    
    try:
        # Crear conexión a la base de datos
        engine = create_engine(settings.database_url)
        
        with engine.connect() as connection:
            # Verificar si la tabla existe
            result = connection.execute(text("""
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE() 
                AND table_name = 'bitacora_procesos'
            """))
            
            table_exists = result.fetchone()[0] > 0
            print(f"🔍 Tabla bitacora_procesos existe: {table_exists}")
            
            if table_exists:
                # Contar registros
                result = connection.execute(text("SELECT COUNT(*) FROM bitacora_procesos"))
                count = result.fetchone()[0]
                print(f"📊 Número de registros en bitacora_procesos: {count}")
                
                if count > 0:
                    # Mostrar algunos registros
                    result = connection.execute(text("""
                        SELECT id, proceso_id, accion, descripcion, fecha_cambio 
                        FROM bitacora_procesos 
                        ORDER BY fecha_cambio DESC 
                        LIMIT 5
                    """))
                    
                    print("\n📋 Últimos 5 registros:")
                    for row in result.fetchall():
                        print(f"  ID: {row[0]}, Proceso: {row[1]}, Acción: {row[2]}, Fecha: {row[4]}")
                        if row[3]:
                            print(f"    Descripción: {row[3]}")
                
                # Verificar registros para un proceso específico
                result = connection.execute(text("""
                    SELECT COUNT(*) FROM bitacora_procesos WHERE proceso_id = 1
                """))
                count_proceso_1 = result.fetchone()[0]
                print(f"\n🎯 Registros para proceso ID 1: {count_proceso_1}")
                
            else:
                print("❌ La tabla bitacora_procesos no existe")
                
    except Exception as e:
        print(f"❌ Error al verificar bitácora: {e}")

if __name__ == "__main__":
    verificar_bitacora()