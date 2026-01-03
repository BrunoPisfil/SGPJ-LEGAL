#!/usr/bin/env python3
"""
Script para iniciar el servidor FastAPI con verificaciones
"""
import os
import sys
import subprocess
from pathlib import Path

def main():
    print("🚀 Iniciando SGPJ Legal Backend...")
    
    # Verificar que estamos en el directorio correcto
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    print(f"📂 Directorio: {backend_dir}")
    
    # Verificar que main.py existe
    if not (backend_dir / "main.py").exists():
        print("❌ Error: main.py no encontrado")
        return False
    
    # Verificar que las dependencias están instaladas
    try:
        import fastapi
        import uvicorn
        print("✅ Dependencias verificadas")
    except ImportError as e:
        print(f"❌ Error: Dependencia faltante - {e}")
        print("💡 Ejecuta: pip install -r requirements.txt")
        return False
    
    # Iniciar servidor
    try:
        print("🌐 Iniciando servidor en http://localhost:8001")
        print("📚 Documentación en http://localhost:8001/docs")
        print("🔄 Recarga automática activada")
        print("⏹️  Presiona Ctrl+C para detener")
        print("-" * 50)
        
        # Usar uvicorn programáticamente
        import uvicorn
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8001,
            reload=True,
            reload_dirs=[str(backend_dir)],
            access_log=True
        )
        
    except KeyboardInterrupt:
        print("\n⏹️  Servidor detenido por el usuario")
        return True
    except Exception as e:
        print(f"❌ Error iniciando servidor: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)