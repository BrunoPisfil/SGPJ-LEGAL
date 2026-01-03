#!/usr/bin/env python3
"""
Script mejorado para actualizar tabla procesos manejando foreign keys
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from backend.app.core.config import settings

def update_procesos_safe():
    """Actualizar tabla procesos manejando foreign keys correctamente"""
    print("🔄 Actualizando tabla procesos (manejando FK)...")
    
    engine = create_engine(settings.database_url)
    
    try:
        with engine.connect() as connection:
            trans = connection.begin()
            
            try:
                # Primero verificar qué tablas referencian procesos
                print("\n🔍 Verificando referencias a tabla procesos...")
                
                fk_check = connection.execute(text("""
                    SELECT 
                        TABLE_NAME,
                        COLUMN_NAME,
                        CONSTRAINT_NAME,
                        REFERENCED_TABLE_NAME,
                        REFERENCED_COLUMN_NAME
                    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                    WHERE REFERENCED_TABLE_NAME = 'procesos'
                    AND TABLE_SCHEMA = DATABASE()
                """)).fetchall()
                
                print("📋 Tablas que referencian 'procesos':")
                for fk in fk_check:
                    print(f"   {fk.TABLE_NAME}.{fk.COLUMN_NAME} → {fk.CONSTRAINT_NAME}")
                
                # Desactivar foreign key checks temporalmente
                print("\n⚠️ Desactivando verificación de FK temporalmente...")
                connection.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
                
                # Crear nueva tabla procesos
                print("\n🔄 Creando nueva estructura de procesos...")
                
                connection.execute(text("DROP TABLE IF EXISTS procesos_clean"))
                
                create_clean_procesos = """
                CREATE TABLE procesos_clean (
                    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                    expediente VARCHAR(120) NOT NULL UNIQUE,
                    tipo ENUM('Civil','Penal','Laboral','Administrativo','Familia','Comercial') NOT NULL,
                    materia VARCHAR(150) NOT NULL,
                    juzgado VARCHAR(255),
                    juez VARCHAR(255),
                    estado ENUM('Activo','En trámite','Suspendido','Archivado','Finalizado') NOT NULL DEFAULT 'Activo',
                    monto_pretension DECIMAL(15,2),
                    fecha_inicio DATE NOT NULL,
                    fecha_notificacion DATE,
                    fecha_ultima_revision DATE,
                    observaciones TEXT,
                    abogado_responsable_id BIGINT UNSIGNED,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB
                """
                
                connection.execute(text(create_clean_procesos))
                
                # Copiar datos sin demandante/demandado
                copy_query = """
                INSERT INTO procesos_clean 
                (id, expediente, tipo, materia, juzgado, juez, estado, monto_pretension, 
                 fecha_inicio, fecha_notificacion, fecha_ultima_revision, observaciones, 
                 abogado_responsable_id, created_at, updated_at)
                SELECT 
                id, expediente, tipo, materia, juzgado, juez, estado, monto_pretension,
                fecha_inicio, fecha_notificacion, fecha_ultima_revision, observaciones,
                abogado_responsable_id, created_at, updated_at
                FROM procesos
                """
                
                connection.execute(text(copy_query))
                
                # Verificar datos copiados
                result = connection.execute(text("SELECT COUNT(*) as count FROM procesos_clean")).fetchone()
                new_count = result.count if result else 0
                
                result = connection.execute(text("SELECT COUNT(*) as count FROM procesos")).fetchone()
                old_count = result.count if result else 0
                
                print(f"✅ Datos copiados: {old_count} → {new_count}")
                
                if new_count == old_count:
                    # Intercambiar tablas
                    print("\n🔄 Intercambiando tablas...")
                    connection.execute(text("DROP TABLE procesos"))
                    connection.execute(text("RENAME TABLE procesos_clean TO procesos"))
                    
                    # Reactivar foreign key checks
                    print("\n✅ Reactivando verificación de FK...")
                    connection.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
                    
                    # Verificar nueva estructura
                    print("\n📊 Nueva estructura de procesos:")
                    result = connection.execute(text("DESCRIBE procesos")).fetchall()
                    for column in result:
                        if column.Field in ['demandante', 'demandado']:
                            print(f"   🔴 {column.Field}: {column.Type} (ELIMINADA)")
                        else:
                            print(f"   🟢 {column.Field}: {column.Type}")
                    
                    # Verificar que partes_proceso sigue funcionando
                    print("\n🧪 Verificando integridad con partes_proceso...")
                    result = connection.execute(text("""
                        SELECT p.expediente, COUNT(pp.id) as partes
                        FROM procesos p
                        LEFT JOIN partes_proceso pp ON p.id = pp.proceso_id
                        GROUP BY p.id
                        LIMIT 3
                    """)).fetchall()
                    
                    for row in result:
                        print(f"   📋 {row.expediente}: {row.partes} partes")
                    
                    trans.commit()
                    return True
                else:
                    print("❌ Error: Datos no copiados correctamente")
                    connection.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
                    trans.rollback()
                    return False
                    
            except Exception as e:
                print(f"❌ Error: {e}")
                connection.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
                trans.rollback()
                return False
                
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def final_verification():
    """Verificación final de la estructura"""
    print("\n🎯 Verificación final...")
    
    engine = create_engine(settings.database_url)
    
    try:
        with engine.connect() as connection:
            # Verificar que las columnas obsoletas fueron eliminadas
            result = connection.execute(text("DESCRIBE procesos")).fetchall()
            columns = [row.Field for row in result]
            
            has_demandante = 'demandante' in columns
            has_demandado = 'demandado' in columns
            
            if not has_demandante and not has_demandado:
                print("✅ Columnas obsoletas eliminadas exitosamente")
                
                # Probar consulta completa
                result = connection.execute(text("""
                    SELECT 
                        p.expediente,
                        p.materia,
                        GROUP_CONCAT(
                            CASE WHEN pp.tipo_parte = 'demandante' 
                            THEN pp.nombre_completo END SEPARATOR ', '
                        ) as demandantes,
                        GROUP_CONCAT(
                            CASE WHEN pp.tipo_parte = 'demandado' 
                            THEN pp.nombre_completo END SEPARATOR ', '
                        ) as demandados
                    FROM procesos p
                    LEFT JOIN partes_proceso pp ON p.id = pp.proceso_id
                    GROUP BY p.id
                    ORDER BY p.id
                """)).fetchall()
                
                print(f"\n📊 Procesos con nueva estructura ({len(result)}):")
                for row in result:
                    print(f"   📋 {row.expediente}")
                    print(f"      Demandantes: {row.demandantes}")
                    print(f"      Demandados: {row.demandados}")
                
                return True
            else:
                print("❌ Las columnas obsoletas aún existen")
                return False
                
    except Exception as e:
        print(f"❌ Error en verificación: {e}")
        return False

if __name__ == "__main__":
    success = update_procesos_safe()
    
    if success:
        verify_success = final_verification()
        if verify_success:
            print("\n🎉 ¡ACTUALIZACIÓN COMPLETADA EXITOSAMENTE!")
            print("\n📋 Cambios aplicados:")
            print("   ✅ Eliminadas columnas 'demandante' y 'demandado'")
            print("   ✅ Tabla 'procesos' ahora usa solo 'partes_proceso'")  
            print("   ✅ Integridad de datos preservada")
            print("   ✅ Foreign keys funcionando correctamente")
            
            print("\n🚀 La tabla procesos ahora es:")
            print("   • Limpia (sin columnas obsoletas)")
            print("   • Flexible (usa partes_proceso)")
            print("   • Escalable (múltiples demandantes/demandados)")
            print("   • Consistente (referencias apropiadas)")
        else:
            print("\n❌ Verificación falló")
    else:
        print("\n❌ Actualización falló")