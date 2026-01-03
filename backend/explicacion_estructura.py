#!/usr/bin/env python3
"""
Explicación clara de cómo funciona la nueva estructura de procesos
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from backend.app.core.config import settings

def explicar_estructura():
    """Explicar con ejemplos reales cómo funciona la estructura"""
    
    print("📚 EXPLICACIÓN: ¿CÓMO FUNCIONAN LOS PROCESOS AHORA?")
    print("="*60)
    
    print("\n🎯 CONCEPTO CLAVE:")
    print("   • Tabla PROCESOS = Información general del caso")
    print("   • Tabla PARTES_PROCESO = Quiénes están involucrados")
    
    print("\n🔗 RELACIÓN:")
    print("   1 PROCESO puede tener MÚLTIPLES PARTES")
    print("   (como 1 caso judicial con varios demandantes/demandados)")

def mostrar_ejemplo_visual():
    """Mostrar ejemplo visual con datos reales"""
    
    engine = create_engine(settings.database_url)
    
    try:
        with engine.connect() as connection:
            print("\n" + "="*60)
            print("📋 EJEMPLO CON DATOS REALES:")
            print("="*60)
            
            # Obtener un proceso específico
            proceso = connection.execute(text("""
                SELECT id, expediente, tipo, materia, estado 
                FROM procesos 
                WHERE id = 1
            """)).fetchone()
            
            if proceso:
                print(f"\n🏛️ PROCESO #{proceso.id}")
                print(f"   📄 Expediente: {proceso.expediente}")
                print(f"   ⚖️ Tipo: {proceso.tipo}")
                print(f"   📝 Materia: {proceso.materia}")
                print(f"   📊 Estado: {proceso.estado}")
                
                # Obtener las partes de este proceso
                partes = connection.execute(text("""
                    SELECT id, tipo_parte, nombre_completo, es_nuestro_cliente
                    FROM partes_proceso 
                    WHERE proceso_id = %s
                    ORDER BY tipo_parte, id
                """), (proceso.id,)).fetchall()
                
                print(f"\n👥 PARTES DEL PROCESO:")
                for parte in partes:
                    cliente_tipo = "🏢 NUESTRO CLIENTE" if parte.es_nuestro_cliente else "🔸 TERCERO"
                    print(f"   {parte.tipo_parte.upper()}: {parte.nombre_completo} ({cliente_tipo})")
                
                print(f"\n💡 INTERPRETACIÓN:")
                print(f"   Este es UN proceso judicial que tiene {len(partes)} personas/empresas involucradas.")
                print(f"   En lugar de tener campos fijos 'demandante' y 'demandado',")
                print(f"   ahora cada persona/empresa se registra por separado en 'partes_proceso'.")
    
    except Exception as e:
        print(f"❌ Error: {e}")

def explicar_ventajas():
    """Explicar las ventajas de esta estructura"""
    
    print("\n" + "="*60)
    print("🚀 ¿POR QUÉ ES MEJOR ESTA ESTRUCTURA?")
    print("="*60)
    
    print("\n❌ ANTES (problema):")
    print("   procesos:")
    print("     id | expediente | demandante      | demandado")
    print("     1  | 2024-001   | 'Juan Pérez'    | 'María López'")
    print("   ")
    print("   🔴 Problemas:")
    print("      • Solo 1 demandante y 1 demandado")
    print("      • Texto libre (no referencia a clientes)")
    print("      • No sé quién es MI cliente")
    print("      • No puedo agregar más partes")
    
    print("\n✅ AHORA (solución):")
    print("   procesos:")
    print("     id | expediente | materia")
    print("     1  | 2024-001   | Desalojo")
    print("   ")
    print("   partes_proceso:")
    print("     id | proceso_id | tipo_parte  | cliente_id | es_nuestro_cliente | nombre_completo")
    print("     1  | 1          | demandante  | 5          | ✅ SÍ              | Juan Pérez")
    print("     2  | 1          | demandado   | NULL       | ❌ NO              | María López")
    print("   ")
    print("   ✅ Ventajas:")
    print("      • Múltiples demandantes/demandados")
    print("      • Referencias a tabla clientes")
    print("      • Sé exactamente quién es MI cliente")
    print("      • Puedo agregar cuantas partes quiera")

def casos_de_uso():
    """Mostrar casos de uso específicos"""
    
    print("\n" + "="*60)
    print("🎯 CASOS DE USO REALES:")
    print("="*60)
    
    casos = [
        {
            "titulo": "Caso 1: Herencia familiar",
            "descripcion": "3 hermanos demandan a 1 banco",
            "partes": [
                "👥 DEMANDANTE: Hermano 1 (NUESTRO CLIENTE)",
                "👥 DEMANDANTE: Hermano 2 (NUESTRO CLIENTE)",  
                "👥 DEMANDANTE: Hermano 3 (NUESTRO CLIENTE)",
                "🏢 DEMANDADO: Banco XYZ (TERCERO)"
            ]
        },
        {
            "titulo": "Caso 2: Accidente de tránsito", 
            "descripción": "1 persona demanda a empresa + chofer + aseguradora",
            "partes": [
                "👤 DEMANDANTE: Víctima (NUESTRO CLIENTE)",
                "🏢 DEMANDADO: Empresa transportista (TERCERO)",
                "👤 DEMANDADO: Chofer (TERCERO)",
                "🏢 DEMANDADO: Aseguradora (TERCERO)"
            ]
        },
        {
            "titulo": "Caso 3: Defensa empresarial",
            "descripción": "Defendemos a una empresa que está siendo demandada",
            "partes": [
                "👤 DEMANDANTE: Ex trabajador (TERCERO)",
                "🏢 DEMANDADO: Mi empresa cliente (NUESTRO CLIENTE)"
            ]
        }
    ]
    
    for i, caso in enumerate(casos, 1):
        print(f"\n📋 {caso['titulo']}")
        print(f"   💭 Situación: {caso.get('descripción', caso.get('descripcion', ''))}")
        print(f"   👥 Partes involucradas:")
        for parte in caso['partes']:
            print(f"      • {parte}")
    
    print(f"\n💡 CON LA ESTRUCTURA ANTERIOR:")
    print(f"   ❌ Estos casos eran IMPOSIBLES de manejar")
    print(f"   ❌ Solo podías tener 1 demandante y 1 demandado")
    
    print(f"\n💡 CON LA NUEVA ESTRUCTURA:")
    print(f"   ✅ Todos estos casos son FÁCILES de manejar")
    print(f"   ✅ Cada parte se registra individualmente")
    print(f"   ✅ Sabes exactamente quiénes son tus clientes")

def como_usar_apis():
    """Explicar cómo usar las nuevas APIs"""
    
    print("\n" + "="*60)
    print("🔧 CÓMO USAR EN TU APLICACIÓN:")
    print("="*60)
    
    print("\n1️⃣ CREAR UN PROCESO:")
    print("   POST /procesos")
    print("   {")
    print('     "expediente": "2024-006-CIVIL",')
    print('     "tipo": "Civil",')
    print('     "materia": "Cobro de deudas"')
    print("   }")
    
    print("\n2️⃣ AGREGAR DEMANDANTE (tu cliente):")
    print("   POST /procesos/6/partes")
    print("   {")
    print('     "tipo_parte": "demandante",')
    print('     "tipo_persona": "cliente",')
    print('     "cliente_id": 15,')
    print('     "es_nuestro_cliente": true')
    print("   }")
    
    print("\n3️⃣ AGREGAR DEMANDADO:")
    print("   POST /procesos/6/partes")
    print("   {")
    print('     "tipo_parte": "demandado",')
    print('     "tipo_persona": "cliente",')
    print('     "nombre_completo": "Empresa Deudora S.A.",')
    print('     "documento": "RUC: 20123456789",')
    print('     "es_nuestro_cliente": false')
    print("   }")
    
    print("\n4️⃣ VER TODAS LAS PARTES:")
    print("   GET /procesos/6/partes")
    print("   Respuesta:")
    print("   [")
    print("     {")
    print('       "tipo_parte": "demandante",')
    print('       "nombre_mostrar": "Juan Carlos López",')
    print('       "es_nuestro_cliente": true')
    print("     },")
    print("     {")
    print('       "tipo_parte": "demandado",')
    print('       "nombre_mostrar": "Empresa Deudora S.A.",')
    print('       "es_nuestro_cliente": false')
    print("     }")
    print("   ]")

if __name__ == "__main__":
    explicar_estructura()
    mostrar_ejemplo_visual()
    explicar_ventajas()
    casos_de_uso()
    como_usar_apis()
    
    print("\n" + "="*60)
    print("🎉 RESUMEN FINAL:")
    print("="*60)
    print("📋 PROCESOS = La información básica del caso judicial")
    print("👥 PARTES_PROCESO = Quién está involucrado y en qué rol")
    print("🔗 RELACIÓN = 1 proceso tiene muchas partes")
    print("✅ RESULTADO = Flexibilidad total para cualquier caso")
    print("\n💡 Es como tener una lista de contactos para cada caso,")
    print("   donde cada contacto tiene un rol específico (demandante/demandado)")
    print("   y sabes cuáles son TUS clientes.")