from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from typing import List, Optional
from backend.app.models.resolucion import Resolucion
from backend.app.models.proceso import Proceso
from backend.app.schemas.resolucion import ResolucionCreate, ResolucionUpdate
from datetime import datetime


class ResolucionService:
    def __init__(self, db: Session):
        self.db = db

    def create_resolucion(self, resolucion_data: ResolucionCreate) -> Resolucion:
        """Crear una nueva resolución"""
        # Verificar que el proceso existe
        proceso = self.db.query(Proceso).filter(Proceso.id == resolucion_data.proceso_id).first()
        if not proceso:
            raise ValueError(f"Proceso con ID {resolucion_data.proceso_id} no encontrado")

        resolucion = Resolucion(
            proceso_id=resolucion_data.proceso_id,
            tipo=resolucion_data.tipo,
            fecha_notificacion=resolucion_data.fecha_notificacion,
            accion_requerida=resolucion_data.accion_requerida,
            fecha_limite=resolucion_data.fecha_limite,
            responsable=resolucion_data.responsable,
            estado_accion=resolucion_data.estado_accion,
            notas=resolucion_data.notas
        )
        
        self.db.add(resolucion)
        self.db.commit()
        self.db.refresh(resolucion)
        
        return resolucion

    def get_resolucion_by_id(self, resolucion_id: int) -> Optional[Resolucion]:
        """Obtener una resolución por su ID"""
        return self.db.query(Resolucion)\
            .options(joinedload(Resolucion.proceso))\
            .filter(Resolucion.id == resolucion_id)\
            .first()

    def get_resoluciones(
        self, 
        skip: int = 0, 
        limit: int = 100,
        proceso_id: Optional[int] = None
    ) -> List[Resolucion]:
        """Obtener lista de resoluciones con paginación y filtros opcionales"""
        query = self.db.query(Resolucion)\
            .options(joinedload(Resolucion.proceso))
        
        if proceso_id:
            query = query.filter(Resolucion.proceso_id == proceso_id)
        
        return query.offset(skip).limit(limit).all()

    def update_resolucion(
        self, 
        resolucion_id: int, 
        resolucion_update: ResolucionUpdate
    ) -> Optional[Resolucion]:
        """Actualizar una resolución existente"""
        resolucion = self.get_resolucion_by_id(resolucion_id)
        if not resolucion:
            return None

        update_data = resolucion_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(resolucion, field, value)

        resolucion.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(resolucion)
        
        return resolucion

    def delete_resolucion(self, resolucion_id: int) -> bool:
        """Eliminar una resolución"""
        resolucion = self.get_resolucion_by_id(resolucion_id)
        if not resolucion:
            return False

        self.db.delete(resolucion)
        self.db.commit()
        return True

    def get_resoluciones_by_proceso(self, proceso_id: int) -> List[Resolucion]:
        """Obtener todas las resoluciones de un proceso específico"""
        return self.db.query(Resolucion)\
            .options(joinedload(Resolucion.proceso))\
            .filter(Resolucion.proceso_id == proceso_id)\
            .order_by(Resolucion.created_at.desc())\
            .all()