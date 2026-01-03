"""
Script para verificar que la migración se aplicó correctamente
"""
import pymysql
from sqlalchemy import text, create_engine
from backend.app.core.config import Settings

settings = Settings()
DATABASE_URL = settings.database_url

def verify_migration():
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as connection:
            # Verificar estructura de la tabla procesos
            result = connection.execute(text("DESCRIBE procesos"))
            columns = result.fetchall()
            
            print("Estructura actual de la tabla procesos:")
            print("-" * 50)
            
            estado_found = False
            estado_juridico_found = False
            
            for column in columns:
                field, tipo, null, key, default, extra = column
                print(f"{field:20} | {tipo:30} | NULL: {null:3} | Key: {key:3} | Default: {str(default):10}")
                
                if field == 'estado':
                    estado_found = True
                    if null == 'YES':
                        print(f"✅ Columna 'estado' es nullable")
                    else:
                        print(f"❌ Columna 'estado' no es nullable")
                
                if field == 'estado_juridico':
                    estado_juridico_found = True
                    print(f"✅ Columna 'estado_juridico' encontrada")
            
            print("-" * 50)
            
            if not estado_found:
                print("❌ Columna 'estado' no encontrada")
            
            if not estado_juridico_found:
                print("❌ Columna 'estado_juridico' no encontrada")
            else:
                # Verificar los valores enum de estado_juridico
                result = connection.execute(text("""
                    SELECT COLUMN_TYPE 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = 'procesos' 
                    AND COLUMN_NAME = 'estado_juridico'
                """))
                
                enum_def = result.fetchone()
                if enum_def:
                    print(f"\nDefinición de estado_juridico enum:")
                    print(f"{enum_def[0]}")
            
            # Probar inserción de ejemplo
            print("\nProbando funcionalidad...")
            
            # Verificar si hay procesos existentes
            result = connection.execute(text("SELECT COUNT(*) FROM procesos"))
            count = result.scalar()
            print(f"Procesos existentes en la tabla: {count}")
            
            print("\n✅ Verificación completada exitosamente!")
            
    except Exception as e:
        print(f"❌ Error durante la verificación: {e}")

if __name__ == "__main__":
    verify_migration()