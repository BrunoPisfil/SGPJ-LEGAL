#!/usr/bin/env python3
"""
Test completo del flujo de autenticación y bitácora
"""
import requests
import json

BASE_URL = "http://localhost:8001"

def test_full_flow():
    """Probar el flujo completo: login + bitácora"""
    
    print("🔐 Probando login...")
    
    # 1. Hacer login
    auth_data = {
        "email": "admin@test.com",
        "password": "admin123"
    }
    
    try:
        login_response = requests.post(
            f"{BASE_URL}/api/v1/auth/login", 
            json=auth_data,  # Cambiar a json
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Login status: {login_response.status_code}")
        
        if login_response.status_code != 200:
            print("❌ Error en login:")
            print(login_response.text)
            return
            
        token_data = login_response.json()
        token = token_data.get("access_token")
        print(f"✅ Token obtenido: {token[:20]}..." if token else "❌ No token")
        
        # 2. Probar endpoint de bitácora con token
        headers = {"Authorization": f"Bearer {token}"}
        
        bitacora_response = requests.get(
            f"{BASE_URL}/api/v1/procesos/1/bitacora",
            headers=headers
        )
        
        print(f"Bitácora status: {bitacora_response.status_code}")
        
        if bitacora_response.status_code == 200:
            data = bitacora_response.json()
            print(f"✅ Bitácora obtenida: {len(data)} entradas")
            
            # Mostrar primeras entradas
            for i, entry in enumerate(data[:3]):
                print(f"  {i+1}. {entry['accion']} - {entry['descripcion']} ({entry['fecha_cambio']})")
                
        else:
            print(f"❌ Error en bitácora:")
            print(bitacora_response.text)
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_full_flow()