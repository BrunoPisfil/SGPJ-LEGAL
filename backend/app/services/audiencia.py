from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List
from datetime import date, datetime
from fastapi import HTTPException

from backend.app.models.audiencia import Audiencia
from backend.app.schemas.audiencia import AudienciaCreate, AudienciaUpdate


class AudienciaService:
    """Servicio para gestión de audiencias"""

    @staticmethod
    def get_all(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        proceso_id: Optional[int] = None,
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None,
        tipo: Optional[str] = None
    ) -> tuple[List[Audiencia], int]:
        """Obtener todas las audiencias con filtros opcionales"""
        query = db.query(Audiencia)
        
        # Aplicar filtros
        if proceso_id:
            query = query.filter(Audiencia.proceso_id == proceso_id)
            
        if fecha_desde:
            query = query.filter(Audiencia.fecha >= fecha_desde)
            
        if fecha_hasta:
            query = query.filter(Audiencia.fecha <= fecha_hasta)
            
        if tipo:
            query = query.filter(Audiencia.tipo.ilike(f"%{tipo}%"))

        total = query.count()
        audiencias = query.order_by(Audiencia.fecha_hora.desc()).offset(skip).limit(limit).all()
        
        return audiencias, total

    @staticmethod
    def get_by_id(db: Session, audiencia_id: int) -> Audiencia:
        """Obtener audiencia por ID"""
        audiencia = db.query(Audiencia).filter(Audiencia.id == audiencia_id).first()
        if not audiencia:
            raise HTTPException(status_code=404, detail=f"Audiencia con ID {audiencia_id} no encontrada")
        return audiencia

    @staticmethod
    def create(db: Session, audiencia_data: AudienciaCreate) -> Audiencia:
        """Crear nueva audiencia"""
        # Verificar que el proceso existe
        from backend.app.models.proceso import Proceso
        proceso = db.query(Proceso).filter(Proceso.id == audiencia_data.proceso_id).first()
        if not proceso:
            raise HTTPException(status_code=400, detail=f"Proceso con ID {audiencia_data.proceso_id} no existe")

        # Validar que no haya conflicto de horarios (opcional)
        fecha_hora_nueva = datetime.combine(audiencia_data.fecha, audiencia_data.hora)
        conflicto = db.query(Audiencia).filter(
            and_(
                Audiencia.proceso_id == audiencia_data.proceso_id,
                Audiencia.fecha == audiencia_data.fecha,
                Audiencia.hora == audiencia_data.hora
            )
        ).first()
        
        if conflicto:
            raise HTTPException(status_code=400, detail="Ya existe una audiencia para este proceso en la misma fecha y hora")

        # Crear la audiencia
        audiencia = Audiencia(**audiencia_data.model_dump())
        db.add(audiencia)
        db.commit()
        db.refresh(audiencia)
        
        return audiencia

    @staticmethod
    def update(db: Session, audiencia_id: int, audiencia_data: AudienciaUpdate) -> Audiencia:
        """Actualizar audiencia existente"""
        audiencia = AudienciaService.get_by_id(db, audiencia_id)
        
        # Actualizar solo los campos proporcionados
        update_data = audiencia_data.model_dump(exclude_unset=True)
        
        # Validar proceso si se está actualizando
        if 'proceso_id' in update_data:
            from backend.app.models.proceso import Proceso
            proceso = db.query(Proceso).filter(Proceso.id == update_data['proceso_id']).first()
            if not proceso:
                raise HTTPException(status_code=400, detail=f"Proceso con ID {update_data['proceso_id']} no existe")

        for field, value in update_data.items():
            setattr(audiencia, field, value)
        
        db.commit()
        db.refresh(audiencia)
        
        return audiencia

    @staticmethod
    def delete(db: Session, audiencia_id: int) -> bool:
        """Eliminar audiencia"""
        audiencia = AudienciaService.get_by_id(db, audiencia_id)
        db.delete(audiencia)
        db.commit()
        return True

    @staticmethod
    def get_by_proceso(db: Session, proceso_id: int) -> List[Audiencia]:
        """Obtener todas las audiencias de un proceso específico"""
        return db.query(Audiencia).filter(
            Audiencia.proceso_id == proceso_id
        ).order_by(Audiencia.fecha_hora.desc()).all()

    @staticmethod
    def get_proximas(db: Session, limit: int = 10) -> List[Audiencia]:
        """Obtener próximas audiencias"""
        return db.query(Audiencia).filter(
            Audiencia.fecha_hora >= datetime.now()
        ).order_by(Audiencia.fecha_hora.asc()).limit(limit).all()