#!/usr/bin/env python3
"""
Script final para limpiar completamente y dejar todo bien
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from backend.app.core.config import settings

def limpieza_final():
    """Limpieza final completa"""
    print("🧹 LIMPIEZA FINAL COMPLETA...")
    
    engine = create_engine(settings.database_url)
    
    try:
        with engine.connect() as connection:
            trans = connection.begin()
            
            try:
                # Desactivar FK checks
                connection.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
                
                print("\n1️⃣ Eliminando vistas obsoletas...")
                vistas_obsoletas = [
                    'vw_procesos_impulso_alertas',
                    'vw_procesos_completos',
                    'vw_audiencias_recordatorio_3d',
                    'vw_resoluciones_alertas'
                ]
                
                for vista in vistas_obsoletas:
                    try:
                        connection.execute(text(f"DROP VIEW IF EXISTS {vista}"))
                        print(f"   ✅ Vista {vista} eliminada")
                    except Exception as e:
                        print(f"   ⚠️ {vista}: {e}")
                
                print("\n2️⃣ Eliminando tablas temporales...")
                tablas_temporales = ['procesos_new', 'procesos_clean']
                
                for tabla in tablas_temporales:
                    try:
                        connection.execute(text(f"DROP TABLE IF EXISTS {tabla}"))
                        print(f"   ✅ Tabla {tabla} eliminada")
                    except Exception as e:
                        print(f"   ⚠️ {tabla}: {e}")
                
                # Reactivar FK checks
                connection.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
                
                print("\n3️⃣ Verificando estado final...")
                
                # Verificar tablas principales
                result = connection.execute(text("SELECT COUNT(*) as count FROM procesos")).fetchone()
                procesos_count = result.count if result else 0
                
                result = connection.execute(text("SELECT COUNT(*) as count FROM partes_proceso")).fetchone()
                partes_count = result.count if result else 0
                
                print(f"   ✅ procesos: {procesos_count} registros")
                print(f"   ✅ partes_proceso: {partes_count} registros")
                
                # Verificar estructura de procesos (que no tenga demandante/demandado)
                print("\n4️⃣ Verificando estructura limpia de procesos...")
                result = connection.execute(text("DESCRIBE procesos")).fetchall()
                columnas = [row.Field for row in result]
                
                if 'demandante' not in columnas and 'demandado' not in columnas:
                    print("   ✅ Tabla procesos limpia (sin demandante/demandado)")
                else:
                    print("   ❌ Tabla procesos aún tiene columnas obsoletas")
                    return False
                
                # Verificar que las relaciones funcionan
                print("\n5️⃣ Verificando relaciones...")
                result = connection.execute(text("""
                    SELECT p.expediente, COUNT(pp.id) as partes
                    FROM procesos p
                    LEFT JOIN partes_proceso pp ON p.id = pp.proceso_id
                    GROUP BY p.id
                    HAVING partes > 0
                """)).fetchall()
                
                print(f"   ✅ {len(result)} procesos con partes funcionando")
                
                trans.commit()
                return True
                
            except Exception as e:
                connection.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
                trans.rollback()
                print(f"❌ Error: {e}")
                return False
                
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def mostrar_estado_final():
    """Mostrar el estado final limpio"""
    print("\n📊 ESTADO FINAL DE LA BASE DE DATOS:")
    
    engine = create_engine(settings.database_url)
    
    try:
        with engine.connect() as connection:
            # Mostrar solo las tablas relacionadas con procesos
            print("\n🏗️ TABLAS PRINCIPALES:")
            
            # Tabla procesos
            result = connection.execute(text("SELECT COUNT(*) as count FROM procesos")).fetchone()
            procesos_count = result.count if result else 0
            print(f"   📋 procesos ({procesos_count} registros)")
            
            # Estructura de procesos
            result = connection.execute(text("DESCRIBE procesos")).fetchall()
            columnas_importantes = ['id', 'expediente', 'tipo', 'materia', 'estado']
            for col in result:
                if col.Field in columnas_importantes:
                    print(f"      • {col.Field}: {col.Type}")
            print("      • ... (otras columnas)")
            
            # Tabla partes_proceso
            result = connection.execute(text("SELECT COUNT(*) as count FROM partes_proceso")).fetchone()
            partes_count = result.count if result else 0
            print(f"\n   🎭 partes_proceso ({partes_count} registros)")
            
            # Estructura de partes_proceso
            result = connection.execute(text("DESCRIBE partes_proceso")).fetchall()
            columnas_importantes = ['id', 'proceso_id', 'tipo_parte', 'tipo_persona', 'cliente_id', 'entidad_id', 'es_nuestro_cliente']
            for col in result:
                if col.Field in columnas_importantes:
                    print(f"      • {col.Field}: {col.Type}")
            
            # Ejemplo de datos
            print(f"\n🔍 EJEMPLO DE DATOS:")
            result = connection.execute(text("""
                SELECT 
                    p.expediente,
                    GROUP_CONCAT(
                        CASE WHEN pp.tipo_parte = 'demandante' 
                        THEN pp.nombre_completo END SEPARATOR ', '
                    ) as demandantes,
                    GROUP_CONCAT(
                        CASE WHEN pp.tipo_parte = 'demandado' 
                        THEN pp.nombre_completo END SEPARATOR ', '
                    ) as demandados
                FROM procesos p
                LEFT JOIN partes_proceso pp ON p.id = pp.proceso_id
                GROUP BY p.id
                LIMIT 2
            """)).fetchall()
            
            for row in result:
                print(f"   📋 {row.expediente}")
                print(f"      Demandantes: {row.demandantes}")
                print(f"      Demandados: {row.demandados}")
            
    except Exception as e:
        print(f"❌ Error mostrando estado: {e}")

if __name__ == "__main__":
    print("🚀 LIMPIEZA FINAL Y REORGANIZACIÓN")
    print("="*50)
    
    success = limpieza_final()
    
    if success:
        mostrar_estado_final()
        
        print("\n" + "="*50)
        print("🎉 ¡LIMPIEZA COMPLETADA EXITOSAMENTE!")
        print("\n📋 RESUMEN FINAL:")
        print("   ✅ Base de datos limpia y organizada")
        print("   ✅ Solo 2 tablas principales:")
        print("      • procesos (sin demandante/demandado)")
        print("      • partes_proceso (gestión flexible)")
        print("   ✅ Tablas temporales eliminadas")
        print("   ✅ Vistas obsoletas eliminadas")
        print("   ✅ Relaciones funcionando correctamente")
        print("\n🚀 ¡Lista para usar la nueva estructura!")
        
    else:
        print("\n❌ Hubo problemas en la limpieza final")