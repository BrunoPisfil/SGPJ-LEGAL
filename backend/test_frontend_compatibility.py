#!/usr/bin/env python3
"""
Script para verificar que la API devuelve datos en el formato correcto
para compatibilidad con el frontend.
"""

import requests
import json
from datetime import datetime

def test_api_procesos():
    """Prueba el endpoint de procesos y verifica la estructura de datos."""
    try:
        # Probar endpoint de procesos
        response = requests.get('http://localhost:8000/api/v1/procesos')
        
        if response.status_code != 200:
            print(f"❌ Error en API: Status {response.status_code}")
            return False
            
        procesos = response.json()
        
        if not procesos:
            print("⚠️  No hay procesos en la base de datos")
            return True
            
        print(f"✅ API devolvió {len(procesos)} procesos")
        
        # Verificar estructura del primer proceso
        proceso = procesos[0]
        
        # Verificar campos requeridos
        required_fields = [
            'id', 'expediente', 'tipo', 'materia', 'estado', 
            'fecha_inicio', 'abogado_responsable_id', 'created_at'
        ]
        
        # Verificar campos normalizados
        normalized_fields = ['juzgado_nombre', 'juez_nombre', 'demandantes', 'demandados']
        
        missing_fields = []
        for field in required_fields + normalized_fields:
            if field not in proceso:
                missing_fields.append(field)
        
        if missing_fields:
            print(f"❌ Faltan campos en proceso: {missing_fields}")
            return False
        
        # Verificar tipos de datos
        print("✅ Estructura de proceso verificada:")
        print(f"   - ID: {proceso['id']}")
        print(f"   - Expediente: {proceso['expediente']}")
        print(f"   - Juzgado: {proceso['juzgado_nombre']}")
        print(f"   - Juez: {proceso.get('juez_nombre', 'No asignado')}")
        print(f"   - Demandantes: {len(proceso['demandantes'])} encontrados")
        print(f"   - Demandados: {len(proceso['demandados'])} encontrados")
        
        # Verificar que las partes sean arrays
        if not isinstance(proceso['demandantes'], list):
            print("❌ 'demandantes' no es un array")
            return False
            
        if not isinstance(proceso['demandados'], list):
            print("❌ 'demandados' no es un array")
            return False
        
        print("✅ Todos los campos tienen el tipo correcto")
        
        # Mostrar ejemplo de estructura completa
        print("\n📋 Estructura completa del primer proceso:")
        print(json.dumps(proceso, indent=2, ensure_ascii=False))
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ No se puede conectar al servidor. ¿Está ejecutándose en localhost:8000?")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

def main():
    """Ejecuta todas las pruebas de compatibilidad."""
    print("🔧 Verificando compatibilidad del frontend con API normalizada\n")
    
    success = test_api_procesos()
    
    if success:
        print("\n🎉 ¡Compatibilidad verificada! El frontend debería funcionar correctamente.")
        print("\n📝 Para probar:")
        print("1. Inicia el backend: cd backend && python -m uvicorn main:app --reload")
        print("2. Inicia el frontend: npm run dev")
        print("3. Navega a http://localhost:3000")
    else:
        print("\n⚠️ Hay problemas de compatibilidad que necesitan resolverse.")

if __name__ == "__main__":
    main()