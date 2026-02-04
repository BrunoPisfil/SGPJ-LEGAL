"""
Servicio para gestión de Diligencias
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from datetime import datetime
from typing import List, Optional
import logging

from app.models.diligencia import Diligencia, EstadoDiligencia
from app.models.proceso import Proceso
from app.schemas.diligencia import DiligenciaCreate, DiligenciaUpdate, DiligenciaResponse

logger = logging.getLogger(__name__)


class DiligenciaService:
    """Servicio para operaciones CRUD de Diligencias"""
    
    @staticmethod
    def crear_diligencia(db: Session, diligencia: DiligenciaCreate) -> Diligencia:
        """Crear una nueva diligencia"""
        # Verificar que el proceso existe si es proporcionado
        if diligencia.proceso_id:
            proceso = db.query(Proceso).filter(Proceso.id == diligencia.proceso_id).first()
            if not proceso:
                raise ValueError(f"Proceso con ID {diligencia.proceso_id} no existe")
        
        db_diligencia = Diligencia(
            proceso_id=diligencia.proceso_id,
            titulo=diligencia.titulo,
            motivo=diligencia.motivo,
            fecha=diligencia.fecha,
            hora=diligencia.hora,
            descripcion=diligencia.descripcion,
            estado=diligencia.estado,
            notificar=diligencia.notificar
        )
        
        db.add(db_diligencia)
        db.commit()
        db.refresh(db_diligencia)
        
        logger.info(f"Diligencia creada: ID {db_diligencia.id}")
        return db_diligencia
    
    @staticmethod
    def obtener_diligencia(db: Session, diligencia_id: int) -> Optional[Diligencia]:
        """Obtener una diligencia por ID"""
        return db.query(Diligencia).filter(Diligencia.id == diligencia_id).first()
    
    @staticmethod
    def obtener_diligencias_proceso(db: Session, proceso_id: int, 
                                     skip: int = 0, limit: int = 100) -> List[Diligencia]:
        """Obtener todas las diligencias de un proceso"""
        return db.query(Diligencia).filter(
            Diligencia.proceso_id == proceso_id
        ).order_by(desc(Diligencia.fecha)).offset(skip).limit(limit).all()
    
    @staticmethod
    def obtener_todas_diligencias(db: Session, skip: int = 0, 
                                   limit: int = 100) -> List[Diligencia]:
        """Obtener todas las diligencias del sistema"""
        return db.query(Diligencia).order_by(
            desc(Diligencia.fecha)
        ).offset(skip).limit(limit).all()
    
    @staticmethod
    def obtener_diligencias_proximas(db: Session, horas: int = 24) -> List[Diligencia]:
        """Obtener diligencias próximas a ocurrir (sin notificación enviada)"""
        from datetime import datetime, timedelta
        
        now = datetime.now()
        target_time = now + timedelta(hours=horas)
        time_margin = timedelta(hours=1)
        
        start_range = target_time - time_margin
        end_range = target_time + time_margin
        
        return db.query(Diligencia).filter(
            and_(
                Diligencia.fecha >= now.date(),
                Diligencia.notificar == True,
                Diligencia.notificacion_enviada == False,
                Diligencia.estado.in_([EstadoDiligencia.PENDIENTE, EstadoDiligencia.EN_PROGRESO])
            )
        ).all()
    
    @staticmethod
    def actualizar_diligencia(db: Session, diligencia_id: int, 
                              actualizar: DiligenciaUpdate) -> Optional[Diligencia]:
        """Actualizar una diligencia"""
        db_diligencia = db.query(Diligencia).filter(Diligencia.id == diligencia_id).first()
        
        if not db_diligencia:
            return None
        
        actualizar_datos = actualizar.model_dump(exclude_unset=True)
        
        for key, value in actualizar_datos.items():
            if value is not None:
                setattr(db_diligencia, key, value)
        
        db.add(db_diligencia)
        db.commit()
        db.refresh(db_diligencia)
        
        logger.info(f"Diligencia actualizada: ID {diligencia_id}")
        return db_diligencia
    
    @staticmethod
    def eliminar_diligencia(db: Session, diligencia_id: int) -> bool:
        """Eliminar una diligencia"""
        db_diligencia = db.query(Diligencia).filter(Diligencia.id == diligencia_id).first()
        
        if not db_diligencia:
            return False
        
        db.delete(db_diligencia)
        db.commit()
        
        logger.info(f"Diligencia eliminada: ID {diligencia_id}")
        return True
    
    @staticmethod
    def marcar_notificacion_enviada(db: Session, diligencia_id: int) -> bool:
        """Marcar una diligencia como notificada"""
        db_diligencia = db.query(Diligencia).filter(Diligencia.id == diligencia_id).first()
        
        if not db_diligencia:
            return False
        
        db_diligencia.notificacion_enviada = True
        db.add(db_diligencia)
        db.commit()
        
        logger.info(f"Diligencia marcada como notificada: ID {diligencia_id}")
        return True
    
    @staticmethod
    def contar_diligencias_proceso(db: Session, proceso_id: int) -> int:
        """Contar diligencias de un proceso"""
        return db.query(Diligencia).filter(
            Diligencia.proceso_id == proceso_id
        ).count()
