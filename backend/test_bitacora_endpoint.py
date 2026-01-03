#!/usr/bin/env python3
"""
Test del endpoint de bitácora para verificar que funciona correctamente
"""

import requests
import json

# Configuración del servidor
BASE_URL = "http://localhost:8000/api/v1"

def test_bitacora_endpoint():
    """Probar el endpoint de bitácora"""
    
    # Primero obtener un token de autenticación
    auth_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        # Login para obtener token
        auth_response = requests.post(f"{BASE_URL}/auth/login", data=auth_data)
        print(f"Auth status: {auth_response.status_code}")
        
        if auth_response.status_code == 200:
            token_data = auth_response.json()
            token = token_data.get("access_token")
            
            headers = {"Authorization": f"Bearer {token}"}
            
            # Probar obtener bitácora del proceso 1
            proceso_id = 1
            bitacora_response = requests.get(f"{BASE_URL}/procesos/{proceso_id}/bitacora", headers=headers)
            
            print(f"Bitácora status: {bitacora_response.status_code}")
            print(f"Bitácora response: {json.dumps(bitacora_response.json(), indent=2, ensure_ascii=False)}")
            
        else:
            print("Error en autenticación")
            print(auth_response.text)
            
    except requests.exceptions.ConnectionError:
        print("Error: No se pudo conectar al servidor. ¿Está ejecutándose en puerto 8000?")
    except Exception as e:
        print(f"Error inesperado: {e}")

if __name__ == "__main__":
    test_bitacora_endpoint()