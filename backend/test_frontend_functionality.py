"""
Script de prueba rápida para verificar el frontend
"""
import os
import webbrowser
import time

def test_frontend():
    print("🚀 Iniciando prueba del frontend...")
    print("\n📝 Puntos de verificación:")
    print("1. ¿Se cargan correctamente los procesos?")
    print("2. ¿Se pueden editar los estados sin errores?")
    print("3. ¿Se muestra correctamente el estado jurídico prioritario?")
    print("4. ¿Funcionan los botones de 'Limpiar' en el formulario?")
    print("5. ¿Se actualiza correctamente el estado en la base de datos?")
    
    print("\n🌐 Abriendo la aplicación en el navegador...")
    print("URL: http://localhost:3000/procesos")
    
    # Dar tiempo para que el usuario vea el mensaje
    time.sleep(2)
    
    # Abrir en el navegador
    try:
        webbrowser.open("http://localhost:3000/procesos")
        print("✅ Navegador abierto")
    except Exception as e:
        print(f"❌ Error al abrir navegador: {e}")
        print("Por favor, abre manualmente: http://localhost:3000/procesos")
    
    print("\n📋 Pasos de prueba sugeridos:")
    print("1. Ve a la lista de procesos")
    print("2. Haz clic en 'Ver' en cualquier proceso")
    print("3. Observa la sección de estados (debería mostrar ambos por separado)")
    print("4. Haz clic en 'Editar'")
    print("5. Prueba seleccionar diferentes estados")
    print("6. Usa los botones 'Limpiar' para eliminar estados")
    print("7. Guarda los cambios y verifica que se actualicen correctamente")

if __name__ == "__main__":
    test_frontend()