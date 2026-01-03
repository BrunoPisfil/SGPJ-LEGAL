#!/usr/bin/env python3
"""
Script para migrar datos existentes de procesos a la nueva estructura
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from backend.app.core.config import settings

def migrar_datos_procesos():
    """Migrar datos de la estructura antigua a la nueva"""
    print("🚀 Iniciando migración de datos de procesos...")
    
    engine = create_engine(settings.database_url)
    
    try:
        with engine.connect() as connection:
            trans = connection.begin()
            
            try:
                # Obtener procesos existentes
                print("\n📊 Obteniendo procesos existentes...")
                result = connection.execute(text("""
                    SELECT id, demandante, demandado 
                    FROM procesos 
                    ORDER BY id
                """)).fetchall()
                
                print(f"Encontrados {len(result)} procesos para migrar")
                
                for proceso in result:
                    proceso_id, demandante, demandado = proceso
                    
                    print(f"\n🔄 Migrando proceso ID {proceso_id}:")
                    print(f"   Demandante: {demandante}")
                    print(f"   Demandado: {demandado}")
                    
                    # Insertar demandante como "nombre_completo" (ya que los datos actuales son texto libre)
                    connection.execute(text("""
                        INSERT INTO partes_proceso 
                        (proceso_id, tipo_parte, tipo_persona, nombre_completo, es_nuestro_cliente)
                        VALUES (:proceso_id, 'demandante', 'cliente', :demandante, 1)
                    """), {"proceso_id": proceso_id, "demandante": demandante})
                    
                    # Insertar demandado
                    connection.execute(text("""
                        INSERT INTO partes_proceso 
                        (proceso_id, tipo_parte, tipo_persona, nombre_completo, es_nuestro_cliente)
                        VALUES (:proceso_id, 'demandado', 'cliente', :demandado, 0)
                    """), {"proceso_id": proceso_id, "demandado": demandado})
                
                # Verificar migración
                result_count = connection.execute(text("SELECT COUNT(*) as count FROM partes_proceso")).fetchone()
                total_partes = result_count.count if result_count else 0
                
                print(f"\n✅ Migración completada:")
                print(f"   • Procesos migrados: {len(result)}")
                print(f"   • Partes creadas: {total_partes}")
                
                trans.commit()
                return True
                
            except Exception as e:
                trans.rollback()
                print(f"❌ Error durante la migración: {e}")
                return False
                
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

if __name__ == "__main__":
    success = migrar_datos_procesos()
    
    if success:
        print("\n🎉 ¡Datos migrados exitosamente!")
        print("\n📋 Próximos pasos:")
        print("   1. Actualizar el modelo Proceso para usar ParteProceso")
        print("   2. Crear/actualizar APIs para manejar partes")
        print("   3. Actualizar frontend para nueva estructura")
    else:
        print("\n❌ La migración de datos falló")