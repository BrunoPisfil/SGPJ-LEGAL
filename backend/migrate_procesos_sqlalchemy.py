#!/usr/bin/env python3
"""
Script de migración usando SQLAlchemy para la nueva estructura de procesos
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from backend.app.core.config import settings
from backend.app.core.database import get_db

def migrate_with_sqlalchemy():
    """Ejecutar migración usando SQLAlchemy"""
    print("🚀 Iniciando migración de estructura de procesos...")
    
    # Crear engine directo
    engine = create_engine(settings.database_url)
    
    try:
        with engine.connect() as connection:
            # Iniciar transacción
            trans = connection.begin()
            
            try:
                print("\n📋 Creando tabla partes_proceso...")
                
                # Crear tabla partes_proceso
                create_partes_sql = """
                CREATE TABLE IF NOT EXISTS partes_proceso (
                    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                    proceso_id BIGINT UNSIGNED NOT NULL,
                    tipo_parte ENUM('demandante', 'demandado', 'tercero') NOT NULL,
                    tipo_persona ENUM('cliente', 'entidad') NOT NULL,
                    cliente_id BIGINT UNSIGNED NULL,
                    entidad_id BIGINT UNSIGNED NULL,
                    es_nuestro_cliente TINYINT(1) NOT NULL DEFAULT 0,
                    nombre_completo VARCHAR(200) NULL,
                    documento VARCHAR(50) NULL,
                    observaciones TEXT,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    
                    KEY idx_partes_proceso (proceso_id),
                    KEY idx_partes_tipo (tipo_parte),
                    KEY idx_partes_cliente (cliente_id),
                    KEY idx_partes_entidad (entidad_id),
                    KEY idx_partes_nuestro_cliente (es_nuestro_cliente),
                    
                    CONSTRAINT fk_partes_proceso FOREIGN KEY (proceso_id) REFERENCES procesos(id) ON DELETE CASCADE,
                    CONSTRAINT fk_partes_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
                    CONSTRAINT fk_partes_entidad FOREIGN KEY (entidad_id) REFERENCES entidades(id) ON DELETE SET NULL
                ) ENGINE=InnoDB
                """
                
                connection.execute(text(create_partes_sql))
                print("✅ Tabla partes_proceso creada exitosamente")
                
                # Verificar si hay datos para migrar
                result = connection.execute(text("SELECT COUNT(*) as count FROM procesos")).fetchone()
                total_procesos = result.count if result else 0
                
                print(f"\n📊 Encontrados {total_procesos} procesos en la base de datos")
                
                if total_procesos > 0:
                    print("\n⚠️ IMPORTANTE: Hay procesos existentes en la base de datos.")
                    print("   La estructura actual tiene campos demandante/demandado como texto.")
                    print("   Para migrar completamente, necesitarás:")
                    print("   1. Ejecutar este script para crear la tabla partes_proceso")
                    print("   2. Migrar manualmente los datos de texto a la nueva estructura")
                    print("   3. Actualizar el modelo Proceso para usar la nueva estructura")
                    print("\n🔄 Creando tabla temporal para la nueva estructura...")
                else:
                    print("✅ No hay datos que migrar, aplicando estructura nueva directamente")
                
                # Confirmar cambios
                trans.commit()
                print("\n🎉 ¡Migración de estructura completada exitosamente!")
                
                print(f"""
📊 Resumen:
   • Tabla partes_proceso creada ✅
   • Constraints aplicados ✅
   • Índices creados ✅
   • Procesos existentes: {total_procesos}
                """)
                
                if total_procesos > 0:
                    print("\n📋 Próximos pasos manuales:")
                    print("   1. Revisar los datos de procesos existentes")
                    print("   2. Migrar demandantes/demandados de texto a partes_proceso")
                    print("   3. Actualizar el modelo Proceso")
                    print("   4. Actualizar las APIs")
                
                return True
                
            except Exception as e:
                trans.rollback()
                print(f"❌ Error durante la migración: {e}")
                return False
                
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

if __name__ == "__main__":
    success = migrate_with_sqlalchemy()
    
    if success:
        print("\n✅ Migración completada exitosamente")
    else:
        print("\n❌ La migración falló")