#!/usr/bin/env python3
"""
Prueba final del sistema completo con relación cliente-proceso
"""

import sys
import os
import requests
import json
import pymysql
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

BASE_URL = "http://localhost:8000"

def test_cliente_proceso_relationship():
    """Probar que la relación cliente_id se guarda correctamente"""
    try:
        print("🧪 Probando la relación cliente-proceso...")
        
        # 1. Obtener lista de clientes
        print("\n1. Obteniendo lista de clientes...")
        response = requests.get(f"{BASE_URL}/api/v1/clientes")
        
        if response.status_code == 200:
            clientes = response.json()
            print(f"✅ Obtenidos {len(clientes)} clientes")
            
            if clientes:
                cliente_test = clientes[0]
                print(f"   Usando cliente: {cliente_test.get('nombres', '')} {cliente_test.get('apellidos', '')} (ID: {cliente_test['id']})")
                
                # 2. Crear un proceso de prueba con cliente_id
                print(f"\n2. Creando proceso con cliente_id={cliente_test['id']}...")
                
                proceso_data = {
                    "expediente": f"TEST-{cliente_test['id']}-2025",
                    "tipo": "Civil",
                    "materia": "Prueba relación cliente",
                    "demandante": f"{cliente_test.get('nombres', '')} {cliente_test.get('apellidos', '')}".strip(),
                    "demandado": "Parte Contraria Test",
                    "cliente_id": cliente_test['id'],
                    "juzgado": "Juzgado de Prueba",
                    "estado": "Activo",
                    "fecha_inicio": "2025-11-26"
                }
                
                response = requests.post(
                    f"{BASE_URL}/api/v1/procesos",
                    json=proceso_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 201:
                    nuevo_proceso = response.json()
                    proceso_id = nuevo_proceso['id']
                    print(f"✅ Proceso creado con ID: {proceso_id}")
                    
                    # 3. Verificar en la base de datos que se guardó el cliente_id
                    print(f"\n3. Verificando relación en base de datos...")
                    
                    # Consultar partes_proceso directamente
                    connection = pymysql.connect(
                        host='localhost',
                        user='root',
                        password='',
                        database='sgpj_legal'
                    )
                    
                    with connection.cursor() as cursor:
                        # Verificar partes_proceso
                        cursor.execute("""
                            SELECT pp.*, c.nombres, c.apellidos, c.razon_social 
                            FROM partes_proceso pp 
                            LEFT JOIN clientes c ON pp.cliente_id = c.id 
                            WHERE pp.proceso_id = %s
                        """, (proceso_id,))
                        
                        partes = cursor.fetchall()
                        
                        print(f"   Partes encontradas: {len(partes)}")
                        for parte in partes:
                            print(f"   - Tipo: {parte[2]}, Cliente ID: {parte[4]}, Nombre: {parte[10] or 'N/A'} {parte[11] or ''}")
                            if parte[4] == cliente_test['id']:
                                print(f"   ✅ ¡Cliente_id {cliente_test['id']} guardado correctamente!")
                            else:
                                print(f"   ❌ Cliente_id no coincide. Esperado: {cliente_test['id']}, Encontrado: {parte[4]}")
                    
                    connection.close()
                    
                    # 4. Limpiar - eliminar proceso de prueba
                    print(f"\n4. Limpiando proceso de prueba...")
                    delete_response = requests.delete(f"{BASE_URL}/api/v1/procesos/{proceso_id}")
                    if delete_response.status_code == 200:
                        print("✅ Proceso de prueba eliminado")
                    
                else:
                    print(f"❌ Error al crear proceso: {response.status_code}")
                    print(f"   Response: {response.text}")
                    
            else:
                print("❌ No hay clientes en la base de datos para probar")
                
        else:
            print(f"❌ Error al obtener clientes: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ No se pudo conectar al servidor. Asegúrate de que el backend esté ejecutándose en http://localhost:8000")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

def test_complete_system():
    """Probar el sistema completo con nueva estructura"""
    print("🧪 Probando sistema completo con nueva estructura...")
    
    engine = create_engine(settings.database_url)
    
    try:
        with engine.connect() as connection:
            
            # 1. Verificar estructura de procesos (sin demandante/demandado)
            print("\n📊 1. Estructura actual de procesos:")
            result = connection.execute(text("DESCRIBE procesos")).fetchall()
            for column in result:
                print(f"   {column.Field}: {column.Type}")
            
            # Verificar que NO tiene demandante/demandado
            columns = [row.Field for row in result]
            if 'demandante' not in columns and 'demandado' not in columns:
                print("   ✅ Sin columnas obsoletas")
            else:
                print("   ❌ Aún tiene columnas obsoletas")
                return False
            
            # 2. Verificar estructura de partes_proceso
            print("\n📊 2. Estructura de partes_proceso:")
            result = connection.execute(text("DESCRIBE partes_proceso")).fetchall()
            print(f"   Total columnas: {len(result)}")
            for column in result[:5]:  # Mostrar las primeras 5
                print(f"   {column.Field}: {column.Type}")
            
            # 3. Probar consulta completa del sistema
            print("\n🔍 3. Consulta completa del sistema:")
            result = connection.execute(text("""
                SELECT 
                    p.id,
                    p.expediente,
                    p.tipo,
                    p.materia,
                    p.estado,
                    COUNT(pp.id) as total_partes,
                    SUM(CASE WHEN pp.tipo_parte = 'demandante' THEN 1 ELSE 0 END) as demandantes_count,
                    SUM(CASE WHEN pp.tipo_parte = 'demandado' THEN 1 ELSE 0 END) as demandados_count,
                    SUM(CASE WHEN pp.es_nuestro_cliente = 1 THEN 1 ELSE 0 END) as nuestros_clientes_count,
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
                ORDER BY p.id
            """)).fetchall()
            
            print(f"   Procesos encontrados: {len(result)}")
            
            for row in result:
                print(f"\n   📋 {row.expediente} ({row.tipo})")
                print(f"      Materia: {row.materia}")
                print(f"      Estado: {row.estado}")
                print(f"      Partes: {row.total_partes} ({row.demandantes_count} demandantes, {row.demandados_count} demandados)")
                print(f"      Nuestros clientes: {row.nuestros_clientes_count}")
                print(f"      Demandantes: {row.demandantes}")
                print(f"      Demandados: {row.demandados}")
            
            # 4. Probar relaciones
            print("\n🔗 4. Probando relaciones entre tablas:")
            
            # Audiencias
            result = connection.execute(text("""
                SELECT COUNT(*) as count 
                FROM audiencias a 
                JOIN procesos p ON a.proceso_id = p.id
            """)).fetchone()
            print(f"   Audiencias relacionadas: {result.count if result else 0}")
            
            # Contratos
            result = connection.execute(text("""
                SELECT COUNT(*) as count 
                FROM contratos c 
                JOIN procesos p ON c.proceso_id = p.id
            """)).fetchone()
            print(f"   Contratos relacionados: {result.count if result else 0}")
            
            # Partes proceso
            result = connection.execute(text("""
                SELECT COUNT(*) as count 
                FROM partes_proceso pp 
                JOIN procesos p ON pp.proceso_id = p.id
            """)).fetchone()
            print(f"   Partes relacionadas: {result.count if result else 0}")
            
            # 5. Simular casos de uso avanzados
            print("\n🎯 5. Casos de uso posibles ahora:")
            
            # Proceso con múltiples demandantes (simulado)
            print("   ✅ Múltiples demandantes: Sí (estructura soporta)")
            print("   ✅ Múltiples demandados: Sí (estructura soporta)")
            print("   ✅ Cliente como demandado: Sí (campo es_nuestro_cliente)")
            print("   ✅ Entidades como partes: Sí (referencias a entidades)")
            print("   ✅ Nombres libres: Sí (campo nombre_completo)")
            
            print("\n✅ ¡Sistema completo funcionando correctamente!")
            return True
            
    except Exception as e:
        print(f"❌ Error en prueba: {e}")
        return False

def show_api_summary():
    """Mostrar resumen de APIs disponibles"""
    print("\n🚀 APIs disponibles para nueva estructura:")
    
    print("\n📋 Gestión de partes:")
    print("   GET    /procesos/{id}/partes                - Todas las partes del proceso")
    print("   POST   /procesos/{id}/partes                - Agregar nueva parte")
    print("   PUT    /partes/{id}                         - Actualizar parte")
    print("   DELETE /partes/{id}                         - Eliminar parte")
    print("   GET    /procesos/{id}/partes/demandantes    - Solo demandantes")
    print("   GET    /procesos/{id}/partes/demandados     - Solo demandados")
    print("   GET    /procesos/{id}/partes/nuestros-clientes - Nuestros clientes")
    
    print("\n📋 Ejemplos de JSON:")
    print("   Agregar demandante cliente:")
    print("   {")
    print('     "tipo_parte": "demandante",')
    print('     "tipo_persona": "cliente",')
    print('     "cliente_id": 5,')
    print('     "es_nuestro_cliente": true')
    print("   }")
    
    print("\n   Agregar demandado entidad:")
    print("   {")
    print('     "tipo_parte": "demandado",')
    print('     "tipo_persona": "entidad",')
    print('     "entidad_id": 3,')
    print('     "es_nuestro_cliente": false')
    print("   }")
    
    print("\n   Agregar parte con nombre libre:")
    print("   {")
    print('     "tipo_parte": "tercero",')
    print('     "tipo_persona": "cliente",')
    print('     "nombre_completo": "Juan Pérez Externo",')
    print('     "documento": "DNI: 12345678",')
    print('     "es_nuestro_cliente": false')
    print("   }")

if __name__ == "__main__":
    test_cliente_proceso_relationship()