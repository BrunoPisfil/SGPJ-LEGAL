"""
Script de migración final: Consolidar datos en tabla 'directorio'
Con manejo de foreign keys deshabilitados temporalmente
"""

import pymysql

def migrate_directorio_final():
    """Migración completa con deshabilitación de FKs"""
    
    conn = pymysql.connect(
        host='localhost',
        user='root',
        password='',
        database='sgpj_legal'
    )
    
    cursor = conn.cursor()
    
    try:
        print("🔄 MIGRACIÓN FINAL A TABLA 'DIRECTORIO'\n")
        
        # 1. Deshabilitar foreign keys temporalmente
        print("1️⃣  Deshabilitando foreign keys...")
        cursor.execute("SET FOREIGN_KEY_CHECKS=0")
        print("   ✅ FKs deshabilitadas\n")
        
        # 2. Limpiar tabla directorio
        print("2️⃣  Limpiando tabla 'directorio'...")
        cursor.execute("DELETE FROM directorio")
        cursor.execute("ALTER TABLE directorio AUTO_INCREMENT = 1")
        conn.commit()
        print("   ✅ Tabla limpiada\n")
        
        # 3. Migrar CLIENTES
        print("3️⃣  Migrando clientes...")
        cursor.execute("""
            INSERT INTO directorio (
                tipo, nombre, email, telefono, direccion,
                tipo_persona, nombres, apellidos, razon_social,
                doc_tipo, doc_numero, activo, created_at, updated_at
            )
            SELECT
                'cliente' as tipo,
                CASE 
                    WHEN tipo_persona = 'natural' THEN CONCAT(COALESCE(nombres, ''), ' ', COALESCE(apellidos, ''))
                    ELSE COALESCE(razon_social, '')
                END as nombre,
                email, telefono, direccion,
                tipo_persona, nombres, apellidos, razon_social,
                doc_tipo, doc_numero, activo, created_at, updated_at
            FROM clientes
            ORDER BY id
        """)
        clientes_migrados = cursor.rowcount
        conn.commit()
        print(f"   ✅ {clientes_migrados} clientes migrados\n")
        
        # 4. Obtener mapeo de clientes
        cursor.execute("""
            SELECT clientes.id, directorio.id 
            FROM clientes 
            JOIN directorio ON (
                directorio.tipo = 'cliente' AND
                directorio.doc_tipo = clientes.doc_tipo AND
                directorio.doc_numero = clientes.doc_numero
            )
            ORDER BY clientes.id
        """)
        cliente_id_map = dict(cursor.fetchall())
        print(f"📌 Mapeo de clientes: {cliente_id_map}\n")
        
        # 5. Migrar JUZGADOS
        print("5️⃣  Migrando juzgados...")
        cursor.execute("""
            INSERT INTO directorio (
                tipo, nombre, direccion, telefono,
                distrito_judicial, activo, created_at, updated_at
            )
            SELECT
                'juzgado' as tipo, nombre, direccion, telefono,
                distrito_judicial, TRUE, created_at, updated_at
            FROM juzgados
            ORDER BY id
        """)
        juzgados_migrados = cursor.rowcount
        conn.commit()
        print(f"   ✅ {juzgados_migrados} juzgados migrados\n")
        
        # 6. Obtener mapeo de juzgados
        cursor.execute("""
            SELECT juzgados.id, directorio.id 
            FROM juzgados 
            JOIN directorio ON directorio.nombre = juzgados.nombre
            AND directorio.tipo = 'juzgado'
            ORDER BY juzgados.id
        """)
        juzgado_id_map = dict(cursor.fetchall())
        print(f"📌 Mapeo de juzgados: {juzgado_id_map}\n")
        
        # 7. Migrar ESPECIALISTAS
        print("7️⃣  Migrando especialistas...")
        cursor.execute("""
            INSERT INTO directorio (
                tipo, nombre, email, telefono,
                nombres, apellidos, activo, created_at, updated_at
            )
            SELECT
                'especialista' as tipo,
                CONCAT(nombres, ' ', apellidos) as nombre,
                email, telefono,
                nombres, apellidos,
                TRUE, created_at, updated_at
            FROM especialistas
            ORDER BY id
        """)
        especialistas_migrados = cursor.rowcount
        conn.commit()
        print(f"   ✅ {especialistas_migrados} especialistas migrados\n")
        
        # 8. Obtener mapeo de especialistas
        cursor.execute("""
            SELECT especialistas.id, directorio.id 
            FROM especialistas 
            JOIN directorio ON (
                directorio.nombres = especialistas.nombres
                AND directorio.apellidos = especialistas.apellidos
                AND directorio.tipo = 'especialista'
            )
            ORDER BY especialistas.id
        """)
        especialista_id_map = dict(cursor.fetchall())
        print(f"📌 Mapeo de especialistas: {especialista_id_map}\n")
        
        # 9. Actualizar referencias en juzgado_id de especialistas
        print("9️⃣  Actualizando vínculos especialista → juzgado...")
        cursor.execute("""
            SELECT especialistas.id, especialistas.juzgado_id
            FROM especialistas
            WHERE juzgado_id IS NOT NULL
        """)
        for old_especialista_id, old_juzgado_id in cursor.fetchall():
            new_especialista_id = especialista_id_map.get(old_especialista_id)
            new_juzgado_id = juzgado_id_map.get(old_juzgado_id)
            if new_especialista_id and new_juzgado_id:
                cursor.execute(
                    "UPDATE directorio SET juzgado_id = %s WHERE id = %s AND tipo = 'especialista'",
                    (new_juzgado_id, new_especialista_id)
                )
        conn.commit()
        print("   ✅ Vínculos actualizado\n")
        
        # 10. ACTUALIZAR REFERENCIAS EN PROCESOS
        print("🔟 Actualizando referencias en procesos...")
        
        # Actualizar juzgado_id
        for old_id, new_id in juzgado_id_map.items():
            cursor.execute(
                "UPDATE procesos SET juzgado_id = %s WHERE juzgado_id = %s",
                (new_id, old_id)
            )
        juzgados_actualizados = cursor.rowcount
        
        # Actualizar especialista_id
        for old_id, new_id in especialista_id_map.items():
            cursor.execute(
                "UPDATE procesos SET especialista_id = %s WHERE especialista_id = %s",
                (new_id, old_id)
            )
        especialistas_actualizados = cursor.rowcount
        
        conn.commit()
        print(f"   ✅ {juzgados_actualizados} referencias a juzgados actualizadas")
        print(f"   ✅ {especialistas_actualizados} referencias a especialistas actualizadas\n")
        
        # 11. ACTUALIZAR REFERENCIAS EN CONTRATOS
        print("1️⃣1️⃣  Actualizando referencias en contratos...")
        for old_id, new_id in cliente_id_map.items():
            cursor.execute(
                "UPDATE contratos SET cliente_id = %s WHERE cliente_id = %s",
                (new_id, old_id)
            )
        contratos_actualizados = cursor.rowcount
        conn.commit()
        print(f"   ✅ {contratos_actualizados} contratos actualizados\n")
        
        # 12. ACTUALIZAR REFERENCIAS EN PARTES_PROCESO
        print("1️⃣2️⃣  Actualizando referencias en partes_proceso...")
        for old_id, new_id in cliente_id_map.items():
            cursor.execute(
                "UPDATE partes_proceso SET cliente_id = %s WHERE cliente_id = %s",
                (new_id, old_id)
            )
        partes_actualizadas = cursor.rowcount
        conn.commit()
        print(f"   ✅ {partes_actualizadas} partes_proceso actualizadas\n")
        
        # 13. Reabilitar foreign keys
        print("1️⃣3️⃣  Rehabilitando foreign keys...")
        cursor.execute("SET FOREIGN_KEY_CHECKS=1")
        conn.commit()
        print("   ✅ FKs rehabilitadas\n")
        
        # 14. Mostrar resumen final
        cursor.execute("SELECT COUNT(*) FROM directorio")
        total = cursor.fetchone()[0]
        
        print("="*60)
        print("✅ MIGRACIÓN COMPLETADA CON ÉXITO\n")
        print(f"Total registros en 'directorio': {total}")
        print(f"  - Clientes: {clientes_migrados}")
        print(f"  - Juzgados: {juzgados_migrados}")
        print(f"  - Especialistas: {especialistas_migrados}\n")
        
        # 15. Verificar integridad final
        print("="*60)
        print("🔍 VERIFICANDO INTEGRIDAD FINAL:\n")
        
        cursor.execute("""
            SELECT COUNT(*) FROM procesos p
            WHERE p.juzgado_id IS NOT NULL
            AND EXISTS (SELECT 1 FROM directorio d WHERE d.id = p.juzgado_id AND d.tipo = 'juzgado')
        """)
        print(f"  ✅ Procesos con juzgado válido: {cursor.fetchone()[0]}")
        
        cursor.execute("""
            SELECT COUNT(*) FROM procesos p
            WHERE p.especialista_id IS NOT NULL
            AND EXISTS (SELECT 1 FROM directorio d WHERE d.id = p.especialista_id AND d.tipo = 'especialista')
        """)
        print(f"  ✅ Procesos con especialista válido: {cursor.fetchone()[0]}")
        
        cursor.execute("""
            SELECT COUNT(*) FROM contratos c
            WHERE EXISTS (SELECT 1 FROM directorio d WHERE d.id = c.cliente_id AND d.tipo = 'cliente')
        """)
        print(f"  ✅ Contratos con cliente válido: {cursor.fetchone()[0]}")
        
        cursor.execute("""
            SELECT COUNT(*) FROM partes_proceso pp
            WHERE EXISTS (SELECT 1 FROM directorio d WHERE d.id = pp.cliente_id AND d.tipo = 'cliente')
        """)
        print(f"  ✅ Partes_proceso con cliente válido: {cursor.fetchone()[0]}")
        
        print("\n" + "="*60)
        print("📝 PRÓXIMOS PASOS:")
        print("   1. Crear foreign keys desde procesos → directorio")
        print("   2. Crear foreign keys desde contratos → directorio")
        print("   3. Crear foreign keys desde partes_proceso → directorio")
        print("   4. Validar datos en SGPJ")
        print("   5. Eliminar tablas antiguas (clientes, juzgados, especialistas)")
        
        return True
        
    except Exception as e:
        conn.rollback()
        cursor.execute("SET FOREIGN_KEY_CHECKS=1")
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    success = migrate_directorio_final()
    if success:
        print("\n✨ Migración exitosa!")
