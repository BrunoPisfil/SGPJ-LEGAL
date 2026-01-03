#!/usr/bin/env python3
"""
Script para actualizar la tabla procesos eliminando columnas obsoletas
y actualizando el modelo para usar únicamente partes_proceso
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from backend.app.core.config import settings

def update_procesos_table():
    """Actualizar tabla procesos eliminando columnas obsoletas"""
    print("🔄 Actualizando tabla procesos para usar nueva estructura...")
    
    engine = create_engine(settings.database_url)
    
    try:
        with engine.connect() as connection:
            trans = connection.begin()
            
            try:
                # Verificar estructura actual
                print("\n📊 Estructura actual de procesos:")
                result = connection.execute(text("DESCRIBE procesos")).fetchall()
                for column in result:
                    print(f"   {column.Field}: {column.Type}")
                
                # Crear tabla procesos temporal con nueva estructura
                print("\n🔄 Creando tabla procesos con nueva estructura...")
                
                create_new_procesos = """
                CREATE TABLE procesos_new (
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
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    
                    KEY idx_procesos_estado (estado),
                    KEY idx_procesos_expediente (expediente),
                    KEY idx_procesos_abogado (abogado_responsable_id),
                    
                    CONSTRAINT fk_proc_abogado FOREIGN KEY (abogado_responsable_id) REFERENCES usuarios(id)
                ) ENGINE=InnoDB
                """
                
                connection.execute(text(create_new_procesos))
                print("✅ Nueva tabla procesos_new creada")
                
                # Copiar datos (sin las columnas demandante/demandado)
                print("\n🔄 Copiando datos sin columnas demandante/demandado...")
                
                copy_data = """
                INSERT INTO procesos_new 
                (id, expediente, tipo, materia, juzgado, juez, estado, monto_pretension, 
                 fecha_inicio, fecha_notificacion, fecha_ultima_revision, observaciones, 
                 abogado_responsable_id, created_at, updated_at)
                SELECT 
                id, expediente, tipo, materia, juzgado, juez, estado, monto_pretension,
                fecha_inicio, fecha_notificacion, fecha_ultima_revision, observaciones,
                abogado_responsable_id, created_at, updated_at
                FROM procesos
                """
                
                connection.execute(text(copy_data))
                print("✅ Datos copiados exitosamente")
                
                # Verificar que los datos se copiaron correctamente
                result = connection.execute(text("SELECT COUNT(*) as count FROM procesos_new")).fetchone()
                count_new = result.count if result else 0
                
                result = connection.execute(text("SELECT COUNT(*) as count FROM procesos")).fetchone()
                count_old = result.count if result else 0
                
                print(f"📊 Verificación: {count_old} procesos originales → {count_new} procesos nuevos")
                
                if count_new == count_old:
                    # Verificar que las partes_proceso siguen referenciando correctamente
                    result = connection.execute(text("""
                        SELECT COUNT(*) as count 
                        FROM partes_proceso pp 
                        JOIN procesos_new p ON pp.proceso_id = p.id
                    """)).fetchone()
                    
                    partes_validas = result.count if result else 0
                    
                    result = connection.execute(text("SELECT COUNT(*) as count FROM partes_proceso")).fetchone()
                    total_partes = result.count if result else 0
                    
                    print(f"📊 Verificación partes: {partes_validas}/{total_partes} partes con referencias válidas")
                    
                    if partes_validas == total_partes:
                        # Intercambiar tablas
                        print("\n🔄 Aplicando cambios finales...")
                        connection.execute(text("DROP TABLE procesos"))
                        connection.execute(text("RENAME TABLE procesos_new TO procesos"))
                        print("✅ Tabla procesos actualizada exitosamente")
                        
                        # Mostrar nueva estructura
                        print("\n📊 Nueva estructura de procesos:")
                        result = connection.execute(text("DESCRIBE procesos")).fetchall()
                        for column in result:
                            status = "🟢" if column.Field not in ['demandante', 'demandado'] else "🔴"
                            print(f"   {status} {column.Field}: {column.Type}")
                        
                        trans.commit()
                        return True
                    else:
                        print("❌ Error: Las partes no referencian correctamente")
                        trans.rollback()
                        return False
                else:
                    print("❌ Error: No se copiaron todos los datos")
                    trans.rollback()
                    return False
                
            except Exception as e:
                trans.rollback()
                print(f"❌ Error durante la actualización: {e}")
                return False
                
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def verify_new_structure():
    """Verificar que la nueva estructura funciona correctamente"""
    print("\n🧪 Verificando nueva estructura...")
    
    engine = create_engine(settings.database_url)
    
    try:
        with engine.connect() as connection:
            # Verificar que procesos ya no tiene demandante/demandado
            print("\n✅ Verificando que columnas obsoletas fueron eliminadas...")
            result = connection.execute(text("DESCRIBE procesos")).fetchall()
            columns = [row.Field for row in result]
            
            if 'demandante' not in columns and 'demandado' not in columns:
                print("✅ Columnas 'demandante' y 'demandado' eliminadas correctamente")
            else:
                print("❌ Las columnas obsoletas aún existen")
                return False
            
            # Verificar consulta con partes
            print("\n✅ Probando consulta con nueva estructura...")
            result = connection.execute(text("""
                SELECT 
                    p.id,
                    p.expediente,
                    p.materia,
                    p.estado,
                    GROUP_CONCAT(
                        CASE WHEN pp.tipo_parte = 'demandante' 
                        THEN pp.nombre_completo 
                        END SEPARATOR ', '
                    ) as demandantes,
                    GROUP_CONCAT(
                        CASE WHEN pp.tipo_parte = 'demandado' 
                        THEN pp.nombre_completo 
                        END SEPARATOR ', '
                    ) as demandados
                FROM procesos p
                LEFT JOIN partes_proceso pp ON p.id = pp.proceso_id
                GROUP BY p.id
                LIMIT 3
            """)).fetchall()
            
            for row in result:
                print(f"📋 {row.expediente}: {row.demandantes} vs {row.demandados}")
            
            print("✅ Nueva estructura funcionando correctamente")
            return True
            
    except Exception as e:
        print(f"❌ Error en verificación: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Iniciando actualización de tabla procesos...")
    
    success = update_procesos_table()
    
    if success:
        verify_success = verify_new_structure()
        if verify_success:
            print("\n🎉 ¡Actualización completada exitosamente!")
            print("\n📋 Cambios aplicados:")
            print("   ✅ Columnas 'demandante' y 'demandado' eliminadas")
            print("   ✅ Tabla procesos limpia y optimizada")
            print("   ✅ Referencias a partes_proceso funcionando")
            print("   ✅ Integridad de datos mantenida")
            
            print("\n🔄 Próximos pasos:")
            print("   1. Actualizar modelo Proceso en SQLAlchemy")
            print("   2. Actualizar endpoints para usar partes")
            print("   3. Actualizar frontend para nueva estructura")
        else:
            print("\n❌ La verificación falló")
    else:
        print("\n❌ La actualización falló")