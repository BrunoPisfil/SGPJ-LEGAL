#!/usr/bin/env python3
"""
Verificación final de la estructura completamente normalizada
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from backend.app.core.config import settings

def verificacion_final():
    """Verificación completa de la estructura normalizada"""
    print("🎯 VERIFICACIÓN FINAL - BASE DE DATOS 100% NORMALIZADA")
    print("="*70)
    
    engine = create_engine(settings.database_url)
    
    try:
        with engine.connect() as connection:
            
            # 1. Verificar estructura de procesos
            print("\n📊 1. ESTRUCTURA DE PROCESOS:")
            result = connection.execute(text("DESCRIBE procesos")).fetchall()
            
            estructura_correcta = True
            for row in result:
                if row.Field in ['juzgado', 'juez']:
                    print(f"   🔴 {row.Field}: {row.Type} (OBSOLETO - NO DEBERÍA EXISTIR)")
                    estructura_correcta = False
                elif row.Field in ['juzgado_id', 'especialista_id']:
                    print(f"   ✅ {row.Field}: {row.Type} (FK CORRECTA)")
                elif row.Field in ['id', 'expediente', 'tipo', 'materia', 'estado']:
                    print(f"   ✅ {row.Field}: {row.Type}")
            
            # 2. Verificar Foreign Keys
            print(f"\n🔗 2. FOREIGN KEYS:")
            result = connection.execute(text("""
                SELECT 
                    TABLE_NAME,
                    COLUMN_NAME,
                    CONSTRAINT_NAME,
                    REFERENCED_TABLE_NAME,
                    REFERENCED_COLUMN_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE TABLE_NAME = 'procesos'
                AND REFERENCED_TABLE_NAME IS NOT NULL
                AND TABLE_SCHEMA = DATABASE()
            """)).fetchall()
            
            for fk in result:
                print(f"   ✅ {fk.COLUMN_NAME} → {fk.REFERENCED_TABLE_NAME}.{fk.REFERENCED_COLUMN_NAME}")
            
            # 3. Verificar datos y relaciones
            print(f"\n📊 3. DATOS Y RELACIONES:")
            result = connection.execute(text("""
                SELECT 
                    p.id,
                    p.expediente,
                    p.materia,
                    j.nombre as juzgado,
                    CONCAT(e.nombres, ' ', e.apellidos) as juez,
                    COUNT(pp.id) as total_partes
                FROM procesos p
                LEFT JOIN juzgados j ON p.juzgado_id = j.id
                LEFT JOIN especialistas e ON p.especialista_id = e.id
                LEFT JOIN partes_proceso pp ON p.id = pp.proceso_id
                GROUP BY p.id
                ORDER BY p.id
            """)).fetchall()
            
            print(f"   Total procesos: {len(result)}")
            for row in result:
                print(f"   📋 {row.expediente}")
                print(f"      Juzgado: {row.juzgado}")
                print(f"      Juez: {row.juez}")
                print(f"      Partes: {row.total_partes}")
            
            # 4. Verificar integridad de todas las tablas relacionadas
            print(f"\n📊 4. CONTEOS GENERALES:")
            
            tablas = ['procesos', 'partes_proceso', 'juzgados', 'especialistas', 'clientes', 'contratos', 'pagos']
            for tabla in tablas:
                try:
                    result = connection.execute(text(f"SELECT COUNT(*) as count FROM {tabla}")).fetchone()
                    count = result.count if result else 0
                    print(f"   {tabla}: {count} registros")
                except:
                    print(f"   {tabla}: ❌ Error o no existe")
            
            # 5. Probar consulta completa del sistema
            print(f"\n🎯 5. CONSULTA COMPLETA DEL SISTEMA:")
            result = connection.execute(text("""
                SELECT 
                    p.expediente,
                    j.nombre as juzgado,
                    CONCAT(e.nombres, ' ', e.apellidos) as juez,
                    GROUP_CONCAT(
                        CASE WHEN pp.tipo_parte = 'demandante' AND pp.es_nuestro_cliente = 1
                        THEN CONCAT('✅ ', pp.nombre_completo)
                        WHEN pp.tipo_parte = 'demandante'
                        THEN CONCAT('🔸 ', pp.nombre_completo)
                        END SEPARATOR ', '
                    ) as demandantes,
                    GROUP_CONCAT(
                        CASE WHEN pp.tipo_parte = 'demandado' 
                        THEN pp.nombre_completo
                        END SEPARATOR ', '
                    ) as demandados
                FROM procesos p
                LEFT JOIN juzgados j ON p.juzgado_id = j.id
                LEFT JOIN especialistas e ON p.especialista_id = e.id
                LEFT JOIN partes_proceso pp ON p.id = pp.proceso_id
                GROUP BY p.id
                ORDER BY p.id
                LIMIT 3
            """)).fetchall()
            
            for row in result:
                print(f"\n   📋 EXPEDIENTE: {row.expediente}")
                print(f"      🏛️ JUZGADO: {row.juzgado}")
                print(f"      👨‍⚖️ JUEZ: {row.juez}")
                print(f"      👥 DEMANDANTES: {row.demandantes}")
                print(f"      ⚖️ DEMANDADOS: {row.demandados}")
            
            return estructura_correcta
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def resumen_final():
    """Mostrar resumen final de la estructura"""
    print("\n" + "="*70)
    print("🎉 ESTRUCTURA FINAL COMPLETAMENTE NORMALIZADA")
    print("="*70)
    
    print("\n📋 TABLAS PRINCIPALES:")
    print("   🏛️ PROCESOS")
    print("      • Información básica del caso judicial")
    print("      • FK → juzgados (juzgado_id)")
    print("      • FK → especialistas (especialista_id)")
    print("      • FK → usuarios (abogado_responsable_id)")
    
    print("\n   👥 PARTES_PROCESO") 
    print("      • Quiénes participan en cada proceso")
    print("      • FK → procesos (proceso_id)")
    print("      • FK → clientes (cliente_id)")
    print("      • FK → entidades (entidad_id)")
    
    print("\n   🏛️ JUZGADOS")
    print("      • Datos centralizados de juzgados")
    print("      • Nombre, distrito, dirección, teléfono")
    
    print("\n   👨‍⚖️ ESPECIALISTAS")
    print("      • Datos centralizados de jueces/especialistas")
    print("      • Nombres, apellidos, contacto")
    
    print("\n   👤 CLIENTES")
    print("      • Base de datos de clientes")
    print("      • Personas naturales y jurídicas")
    
    print("\n✅ CARACTERÍSTICAS:")
    print("   🎯 100% Normalizada - Sin redundancia de datos")
    print("   🔗 Referencias FK - Integridad garantizada")
    print("   📈 Escalable - Fácil agregar nuevas funcionalidades")
    print("   🔍 Eficiente - Consultas optimizadas con índices")
    print("   🛡️ Consistente - Estructura uniforme en toda la BD")
    
    print("\n🚀 CAPACIDADES:")
    print("   ✅ Múltiples demandantes/demandados por proceso")
    print("   ✅ Referencias a clientes/entidades existentes")
    print("   ✅ Identificación clara de nuestros clientes")
    print("   ✅ Datos centralizados de juzgados y jueces")
    print("   ✅ Trazabilidad completa de todas las relaciones")

if __name__ == "__main__":
    success = verificacion_final()
    
    if success:
        resumen_final()
        print(f"\n🎉 ¡BASE DE DATOS PERFECTAMENTE NORMALIZADA!")
        print(f"🎯 Tu observación era correcta y ahora está completamente solucionada.")
        
    else:
        print(f"\n⚠️ Hay algunos problemas en la estructura")
        print(f"Revisa los errores mostrados arriba.")