#!/usr/bin/env python3
"""
Script para probar la creación de procesos con la API
"""
import requests
import json
from datetime import date

def test_proceso_creation():
    """Prueba la creación de un proceso"""
    
    # Datos de prueba
    proceso_data = {
        "expediente": "TEST-2024-002",
        "tipo": "Civil",
        "materia": "Cobranza de soles",
        "demandante": "Juan Pérez García",
        "demandado": "María López Silva",
        "juzgado": "1º Juzgado Civil de Lima",
        "juez": "Dr. Carlos Mendoza",
        "estado": "Activo",
        "fecha_inicio": str(date.today()),
        "observaciones": "Proceso de prueba desde script"
    }
    
    # Headers
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer test"
    }
    
    # URL del endpoint
    url = "http://127.0.0.1:8001/api/v1/procesos"
    
    print(f"🚀 Probando creación de proceso...")
    print(f"📍 URL: {url}")
    print(f"📦 Datos: {json.dumps(proceso_data, indent=2)}")
    
    try:
        # Hacer la petición
        response = requests.post(url, json=proceso_data, headers=headers, timeout=10)
        
        print(f"\n📊 Status Code: {response.status_code}")
        print(f"📄 Response Headers: {dict(response.headers)}")
        
        if response.status_code in [200, 201]:
            data = response.json()
            print(f"\n✅ Proceso creado exitosamente!")
            print(f"🆔 ID: {data.get('id')}")
            print(f"📋 Expediente: {data.get('expediente')}")
            print(f"🏛️ Juzgado: {data.get('juzgado_nombre', 'N/A')}")
            print(f"👨‍⚖️ Juez: {data.get('juez_nombre', 'N/A')}")
            print(f"👥 Demandante: {data.get('demandantes', [])}")
            print(f"👥 Demandado: {data.get('demandados', [])}")
            return True
        else:
            print(f"\n❌ Error {response.status_code}")
            try:
                error_data = response.json()
                print(f"📄 Error Details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"📄 Raw Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"\n❌ Error de conexión - ¿Está el servidor ejecutándose en {url}?")
        return False
    except requests.exceptions.Timeout:
        print(f"\n❌ Timeout - El servidor no responde")
        return False
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        return False

if __name__ == "__main__":
    success = test_proceso_creation()
    if success:
        print(f"\n🎉 Prueba exitosa!")
    else:
        print(f"\n💥 Prueba fallida!")