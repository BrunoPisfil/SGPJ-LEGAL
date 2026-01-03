"""
Script para crear datos de prueba de procesos judiciales
"""

import sys
import os
from datetime import date, timedelta
from sqlalchemy.orm import Session

# Agregar el directorio padre al path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.app.core.database import SessionLocal
from backend.app.models.proceso import Proceso
from backend.app.models.usuario import Usuario

def create_sample_processes():
    """Crear procesos de prueba"""
    db: Session = SessionLocal()
    
    try:
        # Obtener el usuario admin
        admin_user = db.query(Usuario).filter(Usuario.email == "admin@sgpj.com").first()
        abogado_user = db.query(Usuario).filter(Usuario.email == "abogado@sgpj.com").first()
        
        if not admin_user or not abogado_user:
            print("Error: No se encontraron usuarios de prueba")
            return
        
        # Procesos de prueba
        procesos_data = [
            {
                "expediente": "2024-001-CIVIL",
                "tipo": "Civil",
                "materia": "Desalojo por falta de pago",
                "demandante": "Juan Pérez García",
                "demandado": "María López Rodríguez",
                "juzgado": "1° Juzgado Civil de Lima",
                "juez": "Dr. Carlos Mendoza",
                "estado": "Activo",
                "monto_pretension": 15000.00,
                "fecha_inicio": date(2024, 1, 15),
                "fecha_notificacion": date(2024, 1, 20),
                "fecha_ultima_revision": date(2024, 10, 1),
                "observaciones": "Proceso iniciado por falta de pago de alquiler",
                "abogado_responsable_id": admin_user.id
            },
            {
                "expediente": "2024-002-LABORAL",
                "tipo": "Laboral",
                "materia": "Despido arbitrario",
                "demandante": "Ana María Gonzales",
                "demandado": "Empresa XYZ S.A.C.",
                "juzgado": "2° Juzgado Laboral de Lima",
                "juez": "Dra. Patricia Ruiz",
                "estado": "En trámite",
                "monto_pretension": 25000.00,
                "fecha_inicio": date(2024, 2, 10),
                "fecha_notificacion": date(2024, 2, 15),
                "fecha_ultima_revision": date(2024, 9, 15),
                "observaciones": "Demanda por despido sin causa justa",
                "abogado_responsable_id": abogado_user.id
            },
            {
                "expediente": "2024-003-FAMILIA",
                "tipo": "Familia",
                "materia": "Divorcio por causal",
                "demandante": "Roberto Silva Vega",
                "demandado": "Carmen Torres Espinoza",
                "juzgado": "1° Juzgado de Familia de Lima",
                "juez": "Dr. Miguel Ángel Castro",
                "estado": "Suspendido",
                "monto_pretension": None,
                "fecha_inicio": date(2024, 3, 5),
                "fecha_notificacion": date(2024, 3, 12),
                "fecha_ultima_revision": date(2024, 8, 20),
                "observaciones": "Proceso suspendido por conciliación",
                "abogado_responsable_id": admin_user.id
            },
            {
                "expediente": "2024-004-COMERCIAL",
                "tipo": "Comercial", 
                "materia": "Incumplimiento de contrato",
                "demandante": "Comercial ABC S.A.",
                "demandado": "Distribuidora DEF E.I.R.L.",
                "juzgado": "3° Juzgado Comercial de Lima",
                "juez": "Dr. Fernando Aliaga",
                "estado": "Finalizado",
                "monto_pretension": 50000.00,
                "fecha_inicio": date(2023, 11, 20),
                "fecha_notificacion": date(2023, 11, 25),
                "fecha_ultima_revision": date(2024, 9, 30),
                "observaciones": "Proceso concluido con sentencia favorable",
                "abogado_responsable_id": abogado_user.id
            },
            {
                "expediente": "2024-005-PENAL",
                "tipo": "Penal",
                "materia": "Estafa agravada",
                "demandante": "Ministerio Público",
                "demandado": "Luis Alberto Ramírez",
                "juzgado": "5° Juzgado Penal de Lima",
                "juez": "Dr. Jorge Villarreal",
                "estado": "Activo",
                "monto_pretension": 30000.00,
                "fecha_inicio": date(2024, 4, 8),
                "fecha_notificacion": date(2024, 4, 15),
                "fecha_ultima_revision": None,  # Sin revisión para testing
                "observaciones": "Caso por estafa con documentos falsificados",
                "abogado_responsable_id": admin_user.id
            }
        ]
        
        # Crear los procesos
        for proceso_data in procesos_data:
            # Verificar si ya existe
            existing = db.query(Proceso).filter(Proceso.expediente == proceso_data["expediente"]).first()
            if existing:
                print(f"Proceso {proceso_data['expediente']} ya existe")
                continue
            
            proceso = Proceso(**proceso_data)
            db.add(proceso)
            print(f"Creando proceso: {proceso_data['expediente']}")
        
        db.commit()
        print(f"\n✅ Se crearon {len(procesos_data)} procesos de prueba exitosamente")
        
        # Mostrar estadísticas
        total_procesos = db.query(Proceso).count()
        print(f"📊 Total de procesos en la base de datos: {total_procesos}")
        
    except Exception as e:
        print(f"❌ Error al crear procesos: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_processes()