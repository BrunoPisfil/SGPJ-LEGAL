#!/usr/bin/env python3
"""
Script para probar la nueva estructura de partes de procesos
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from backend.app.core.config import settings

def test_nueva_estructura():
    """Probar la nueva estructura de partes"""
    print("🧪 Probando nueva estructura de partes de procesos...")
    
    engine = create_engine(settings.database_url)
    
    try:
        with engine.connect() as connection:
            # Verificar datos migrados
            print("\n📊 Verificando datos migrados...")
            
            result = connection.execute(text("""
                SELECT 
                    p.id,
                    p.expediente,
                    p.materia,
                    COUNT(pp.id) as total_partes,
                    GROUP_CONCAT(
                        CASE WHEN pp.tipo_parte = 'demandante' 
                        THEN pp.nombre_completo 
                        END SEPARATOR ', '
                    ) as demandantes,
                    GROUP_CONCAT(
                        CASE WHEN pp.tipo_parte = 'demandado' 
                        THEN pp.nombre_completo 
                        END SEPARATOR ', '
                    ) as demandados
                FROM procesos p
                LEFT JOIN partes_proceso pp ON p.id = pp.proceso_id
                GROUP BY p.id
                ORDER BY p.id
            """)).fetchall()
            
            print(f"\nEncontrados {len(result)} procesos con partes:")
            for row in result:
                print(f"\n📋 Proceso {row.id}: {row.expediente}")
                print(f"   Materia: {row.materia}")
                print(f"   Total partes: {row.total_partes}")
                print(f"   Demandantes: {row.demandantes}")
                print(f"   Demandados: {row.demandados}")
            
            # Verificar estructura de tabla partes_proceso
            print("\n📋 Estructura de tabla partes_proceso:")
            result = connection.execute(text("DESCRIBE partes_proceso")).fetchall()
            for column in result:
                print(f"   {column.Field}: {column.Type} {'NULL' if column.Null == 'YES' else 'NOT NULL'}")
            
            # Probar consulta para obtener partes por tipo
            print("\n🔍 Probando consultas por tipo de parte...")
            
            demandantes = connection.execute(text("""
                SELECT proceso_id, nombre_completo, es_nuestro_cliente
                FROM partes_proceso 
                WHERE tipo_parte = 'demandante'
                ORDER BY proceso_id
            """)).fetchall()
            
            print(f"\n👥 Demandantes ({len(demandantes)}):")
            for d in demandantes:
                cliente_tipo = "Nuestro cliente" if d.es_nuestro_cliente else "Tercero"
                print(f"   Proceso {d.proceso_id}: {d.nombre_completo} ({cliente_tipo})")
            
            demandados = connection.execute(text("""
                SELECT proceso_id, nombre_completo, es_nuestro_cliente
                FROM partes_proceso 
                WHERE tipo_parte = 'demandado'
                ORDER BY proceso_id
            """)).fetchall()
            
            print(f"\n⚖️ Demandados ({len(demandados)}):")
            for d in demandados:
                cliente_tipo = "Nuestro cliente" if d.es_nuestro_cliente else "Tercero"
                print(f"   Proceso {d.proceso_id}: {d.nombre_completo} ({cliente_tipo})")
            
            # Verificar nuestros clientes
            nuestros_clientes = connection.execute(text("""
                SELECT proceso_id, tipo_parte, nombre_completo
                FROM partes_proceso 
                WHERE es_nuestro_cliente = 1
                ORDER BY proceso_id, tipo_parte
            """)).fetchall()
            
            print(f"\n🏢 Nuestros clientes ({len(nuestros_clientes)}):")
            for c in nuestros_clientes:
                print(f"   Proceso {c.proceso_id}: {c.nombre_completo} ({c.tipo_parte})")
            
            print("\n✅ ¡Estructura probada exitosamente!")
            return True
            
    except Exception as e:
        print(f"❌ Error durante las pruebas: {e}")
        return False

def test_api_endpoints():
    """Mostrar información sobre los nuevos endpoints"""
    print("\n🚀 Nuevos endpoints de API creados:")
    print("   GET    /procesos/{proceso_id}/partes                - Obtener todas las partes")
    print("   POST   /procesos/{proceso_id}/partes                - Agregar nueva parte")
    print("   PUT    /partes/{parte_id}                           - Actualizar parte")
    print("   DELETE /partes/{parte_id}                           - Eliminar parte")
    print("   GET    /procesos/{proceso_id}/partes/demandantes    - Solo demandantes")
    print("   GET    /procesos/{proceso_id}/partes/demandados     - Solo demandados")
    print("   GET    /procesos/{proceso_id}/partes/nuestros-clientes - Solo nuestros clientes")
    
    print("\n📋 Ejemplo de uso:")
    print("   Agregar demandado: POST /procesos/1/partes")
    print("   {")
    print('     "tipo_parte": "demandado",')
    print('     "tipo_persona": "cliente",')
    print('     "nombre_completo": "Nueva Empresa S.A.C.",')
    print('     "documento": "RUC: 20123456789",')
    print('     "es_nuestro_cliente": false')
    print("   }")

if __name__ == "__main__":
    success = test_nueva_estructura()
    
    if success:
        test_api_endpoints()
        print("\n🎉 ¡Sistema de partes implementado correctamente!")
        print("\n📋 Beneficios de la nueva estructura:")
        print("   ✅ Flexibilidad: Múltiples demandantes y demandados")
        print("   ✅ Referencias: Clientes/entidades o nombres libres")
        print("   ✅ Rol claro: Identifica qué partes son nuestros clientes")
        print("   ✅ Escalabilidad: Fácil agregar terceros o más partes")
        print("   ✅ APIs completas: CRUD completo para gestión de partes")
    else:
        print("\n❌ Hubo errores en las pruebas")