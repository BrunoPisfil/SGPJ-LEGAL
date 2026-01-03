"""
Script para probar la funcionalidad del sistema dual-state
"""
import requests
import json
from backend.app.core.config import Settings

settings = Settings()
BASE_URL = "http://localhost:8000"

def test_api():
    try:
        # 1. Probar obtener lista de procesos
        print("1. Probando GET /api/v1/procesos")
        response = requests.get(f"{BASE_URL}/api/v1/procesos")
        
        if response.status_code == 200:
            procesos = response.json()
            print(f"✅ Obtenidos {len(procesos)} procesos")
            
            if procesos:
                # 2. Probar obtener un proceso específico
                proceso_id = procesos[0]["id"]
                print(f"\n2. Probando GET /api/v1/procesos/{proceso_id}")
                
                response = requests.get(f"{BASE_URL}/api/v1/procesos/{proceso_id}")
                
                if response.status_code == 200:
                    proceso = response.json()
                    print(f"✅ Proceso obtenido: {proceso['expediente']}")
                    print(f"   Estado: {proceso.get('estado', 'None')}")
                    print(f"   Estado Jurídico: {proceso.get('estado_juridico', 'None')}")
                    
                    # 3. Probar actualización con estado jurídico
                    print(f"\n3. Probando PUT /api/v1/procesos/{proceso_id}")
                    
                    update_data = {
                        "estado": "En trámite",
                        "estado_juridico": "pendiente_impulsar",
                        "observaciones": "Prueba de sistema dual-state"
                    }
                    
                    response = requests.put(
                        f"{BASE_URL}/api/v1/procesos/{proceso_id}",
                        json=update_data,
                        headers={"Content-Type": "application/json"}
                    )
                    
                    if response.status_code == 200:
                        updated_proceso = response.json()
                        print(f"✅ Proceso actualizado exitosamente")
                        print(f"   Estado: {updated_proceso.get('estado')}")
                        print(f"   Estado Jurídico: {updated_proceso.get('estado_juridico')}")
                        print(f"   Observaciones: {updated_proceso.get('observaciones')}")
                    else:
                        print(f"❌ Error actualizando proceso: {response.status_code}")
                        print(f"   Response: {response.text}")
                        
                else:
                    print(f"❌ Error obteniendo proceso: {response.status_code}")
        else:
            print(f"❌ Error obteniendo procesos: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ No se pudo conectar al servidor. Asegúrate de que el backend esté ejecutándose en http://localhost:8000")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

if __name__ == "__main__":
    test_api()