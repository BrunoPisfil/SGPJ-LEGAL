#!/usr/bin/env python3
"""
Script para aplicar la migración: Cambiar FK de contratos.cliente_id
De: clientes(id) 
A: directorio(id)
"""

import sys
from sqlalchemy import create_engine, text
from app.core.config import Settings

def apply_migration():
    """Aplicar la migración SQL"""
    settings = Settings()
    
    try:
        # Crear conexión
        engine = create_engine(settings.database_url)
        
        with engine.begin() as connection:
            print("🔄 Iniciando migración...")
            
            # Mostrar constraint actual
            print("\n📋 Estado actual de la tabla contratos:")
            result = connection.execute(text("SHOW CREATE TABLE contratos"))
            for row in result:
                print(row[1])
            
            # Paso 1: Eliminar la FK existente
            try:
                print("\n🗑️  Eliminando constraint fk_contrato_cliente...")
                connection.execute(text("ALTER TABLE contratos DROP FOREIGN KEY fk_contrato_cliente"))
                print("✅ Constraint eliminado")
            except Exception as e:
                print(f"⚠️  Constraint no encontrado o ya fue eliminado: {e}")
            
            # Paso 2: Agregar la nueva FK
            print("\n🔗 Agregando nuevo constraint a directorio...")
            connection.execute(text(
                "ALTER TABLE contratos ADD CONSTRAINT fk_contrato_cliente "
                "FOREIGN KEY (cliente_id) REFERENCES directorio(id)"
            ))
            print("✅ Nuevo constraint agregado")
            
            # Verificar el resultado
            print("\n✨ Estado final de la tabla contratos:")
            result = connection.execute(text("SHOW CREATE TABLE contratos"))
            for row in result:
                print(row[1])
            
            print("\n✅ Migración completada exitosamente!")
            return True
            
    except Exception as e:
        print(f"\n❌ Error durante la migración: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = apply_migration()
    sys.exit(0 if success else 1)
