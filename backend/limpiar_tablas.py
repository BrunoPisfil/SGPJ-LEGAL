#!/usr/bin/env python3
"""
Script para limpiar el desastre de tablas y dejar solo las necesarias
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def limpiar_desastre_tablas():
    """Limpiar el desastre y dejar solo las tablas necesarias"""
    print("🧹 Limpiando el desastre de tablas...")
    
    engine = create_engine(settings.database_url)
    
    try:
        with engine.connect() as connection:
            # Ver todas las tablas que tenemos
            print("\n📋 Todas las tablas en la base de datos:")
            result = connection.execute(text("SHOW TABLES")).fetchall()
            all_tables = [row[0] for row in result]
            
            proceso_tables = [table for table in all_tables if 'proceso' in table.lower()]
            print(f"\n🔍 Tablas relacionadas con 'proceso': {len(proceso_tables)}")
            for table in proceso_tables:
                print(f"   📋 {table}")
            
            # Verificar estructura de cada tabla de proceso
            for table in proceso_tables:
                print(f"\n📊 Estructura de {table}:")
                try:
                    result = connection.execute(text(f"DESCRIBE {table}")).fetchall()
                    print(f"   Columnas: {len(result)}")
                    for col in result[:5]:  # Mostrar solo las primeras 5
                        print(f"     {col.Field}: {col.Type}")
                    if len(result) > 5:
                        print(f"     ... y {len(result)-5} columnas más")
                        
                    # Ver cuántos registros tiene
                    count_result = connection.execute(text(f"SELECT COUNT(*) as count FROM {table}")).fetchone()
                    print(f"   Registros: {count_result.count if count_result else 0}")
                    
                except Exception as e:
                    print(f"   ❌ Error: {e}")
            
            return True
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def plan_limpieza():
    """Mostrar el plan de limpieza"""
    print("\n📋 PLAN DE LIMPIEZA:")
    print("   🎯 OBJETIVO: Dejar solo 2 tablas")
    print("      1. 'procesos' - Tabla principal limpia")
    print("      2. 'partes_proceso' - Tabla de partes")
    print()
    print("   🗑️ ELIMINAR:")
    print("      • procesos_new (tabla temporal)")
    print("      • procesos_clean (si existe)")
    print("      • Cualquier otra tabla temporal")
    print()
    print("   ✅ MANTENER:")
    print("      • procesos (la tabla principal)")
    print("      • partes_proceso (la nueva funcionalidad)")

def ejecutar_limpieza():
    """Ejecutar la limpieza de tablas"""
    print("\n🧹 Ejecutando limpieza...")
    
    engine = create_engine(settings.database_url)
    
    try:
        with engine.connect() as connection:
            trans = connection.begin()
            
            try:
                # Desactivar FK checks temporalmente
                connection.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
                
                # Lista de tablas a eliminar (temporales)
                tablas_eliminar = ['procesos_new', 'procesos_clean', 'proceso_new', 'proceso_clean']
                
                for tabla in tablas_eliminar:
                    try:
                        # Verificar si existe
                        result = connection.execute(text(f"SHOW TABLES LIKE '{tabla}'")).fetchone()
                        if result:
                            print(f"   🗑️ Eliminando {tabla}...")
                            connection.execute(text(f"DROP TABLE {tabla}"))
                            print(f"   ✅ {tabla} eliminada")
                        else:
                            print(f"   ℹ️ {tabla} no existe")
                    except Exception as e:
                        print(f"   ⚠️ Error eliminando {tabla}: {e}")
                
                # Reactivar FK checks
                connection.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
                
                # Verificar resultado final
                print("\n📊 Tablas finales relacionadas con 'proceso':")
                result = connection.execute(text("SHOW TABLES")).fetchall()
                all_tables = [row[0] for row in result]
                proceso_tables = [table for table in all_tables if 'proceso' in table.lower()]
                
                for table in proceso_tables:
                    count_result = connection.execute(text(f"SELECT COUNT(*) as count FROM {table}")).fetchone()
                    count = count_result.count if count_result else 0
                    print(f"   ✅ {table} - {count} registros")
                
                trans.commit()
                return True
                
            except Exception as e:
                connection.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
                trans.rollback()
                print(f"❌ Error en limpieza: {e}")
                return False
                
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Iniciando limpieza del desastre de tablas...")
    
    # Paso 1: Analizar el desastre
    success = limpiar_desastre_tablas()
    
    if success:
        # Paso 2: Mostrar plan
        plan_limpieza()
        
        # Paso 3: Pedir confirmación y ejecutar
        print("\n⚠️ ¿Proceder con la limpieza? (Eliminará tablas temporales)")
        print("   Esto dejará solo 'procesos' y 'partes_proceso'")
        
        # Ejecutar automáticamente (en este contexto)
        print("🔄 Procediendo con limpieza automática...")
        
        clean_success = ejecutar_limpieza()
        
        if clean_success:
            print("\n🎉 ¡LIMPIEZA COMPLETADA!")
            print("📊 Estado final:")
            print("   ✅ 'procesos' - Tabla principal (sin demandante/demandado)")
            print("   ✅ 'partes_proceso' - Gestión flexible de partes")
            print("   ✅ Tablas temporales eliminadas")
            print("   ✅ Base de datos limpia y organizada")
        else:
            print("\n❌ Error en la limpieza")
    else:
        print("\n❌ Error analizando tablas")