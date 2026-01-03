"""
Script para recrear la tabla procesos con la estructura simplificada
"""

import sys
import os
from sqlalchemy import text

# Agregar el directorio padre al path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.app.core.database import SessionLocal, Base, engine
from backend.app.models.proceso import Proceso

def recreate_procesos_table():
    """Recrear tabla procesos con nueva estructura"""
    db = SessionLocal()
    
    try:
        print("🔄 Recreando tabla procesos...")
        
        # Eliminar restricciones de clave foránea primero
        db.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
        
        # Eliminar tabla existente si existe
        db.execute(text("DROP TABLE IF EXISTS procesos"))
        db.commit()
        print("✅ Tabla procesos eliminada")
        
        # Reactivar restricciones
        db.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
        
        # Crear todas las tablas definidas en los modelos
        Base.metadata.create_all(bind=engine)
        print("✅ Tabla procesos creada con nueva estructura")
        
        # Verificar estructura
        result = db.execute(text("DESCRIBE procesos"))
        columns = result.fetchall()
        
        print("\n📋 Estructura de la tabla procesos:")
        for col in columns:
            print(f"  - {col[0]}: {col[1]} {col[2]} {col[3]} {col[4]} {col[5]}")
        
        print(f"\n🎉 Tabla recreada exitosamente con {len(columns)} columnas")
        
    except Exception as e:
        print(f"❌ Error al recrear tabla: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    recreate_procesos_table()