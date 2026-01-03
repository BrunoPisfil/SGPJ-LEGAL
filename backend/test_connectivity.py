#!/usr/bin/env python3
"""
Script para probar conectividad de puertos
"""
import requests
import json

def test_port(port):
    """Probar si un puerto está disponible"""
    try:
        url = f"http://localhost:{port}"
        response = requests.get(url, timeout=5)
        print(f"✅ Puerto {port}: {response.status_code} - {response.text[:100]}")
        return True
    except Exception as e:
        print(f"❌ Puerto {port}: Error - {e}")
        return False

def test_api_endpoint(port):
    """Probar el endpoint de la API"""
    try:
        url = f"http://localhost:{port}/api/v1"
        response = requests.get(url, timeout=5)
        print(f"📡 API en puerto {port}: {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ API en puerto {port}: Error - {e}")
        return False

if __name__ == "__main__":
    print("🔍 Probando conectividad de puertos...")
    
    # Probar puertos comunes
    ports = [8000, 8001, 3000]
    
    for port in ports:
        print(f"\n--- Puerto {port} ---")
        test_port(port)
        test_api_endpoint(port)
    
    print("\n🔍 Probando endpoint específico de bitácora...")
    # Probar endpoint específico
    for port in [8000, 8001]:
        try:
            url = f"http://localhost:{port}/api/v1/procesos/1/bitacora"
            response = requests.get(url, timeout=5)
            print(f"📋 Bitácora en puerto {port}: {response.status_code}")
        except Exception as e:
            print(f"❌ Bitácora en puerto {port}: Error - {e}")