"""Servicio de negocio para Directorio"""

from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.models.directorio import Directorio
from app.schemas.directorio import DirectorioCreate, DirectorioUpdate
from typing import List, Optional


class DirectorioService:
    """Servicio para operaciones CRUD de directorio"""

    @staticmethod
    def create_directorio(db: Session, directorio_data: DirectorioCreate) -> Directorio:
        """Crear un nuevo registro en directorio"""
        directorio = Directorio(**directorio_data.model_dump())
        db.add(directorio)
        db.commit()
        db.refresh(directorio)
        return directorio

    @staticmethod
    def get_directorio_by_id(db: Session, directorio_id: int) -> Optional[Directorio]:
        """Obtener un registro por ID"""
        return db.query(Directorio).filter(Directorio.id == directorio_id).first()

    @staticmethod
    def get_all_directorio(db: Session, skip: int = 0, limit: int = 100) -> List[Directorio]:
        """Obtener todos los registros con paginación"""
        return db.query(Directorio).offset(skip).limit(limit).all()

    @staticmethod
    def get_directorio_by_tipo(db: Session, tipo: str) -> List[Directorio]:
        """Obtener registros por tipo (cliente, juzgado, especialista)"""
        return db.query(Directorio).filter(Directorio.tipo == tipo).all()

    @staticmethod
    def search_directorio(db: Session, query: str, tipo: Optional[str] = None) -> List[Directorio]:
        """Buscar por nombre, email, teléfono"""
        search_filter = or_(
            Directorio.nombre.ilike(f"%{query}%"),
            Directorio.email.ilike(f"%{query}%"),
            Directorio.telefono.ilike(f"%{query}%"),
            Directorio.doc_numero.ilike(f"%{query}%") if query else False,
        )
        
        if tipo:
            return db.query(Directorio).filter(
                and_(search_filter, Directorio.tipo == tipo)
            ).all()
        
        return db.query(Directorio).filter(search_filter).all()

    @staticmethod
    def get_clientes(db: Session) -> List[Directorio]:
        """Obtener solo clientes"""
        return db.query(Directorio).filter(Directorio.tipo == "cliente").all()

    @staticmethod
    def get_juzgados(db: Session) -> List[Directorio]:
        """Obtener solo juzgados"""
        return db.query(Directorio).filter(Directorio.tipo == "juzgado").all()

    @staticmethod
    def get_especialistas(db: Session) -> List[Directorio]:
        """Obtener solo especialistas"""
        return db.query(Directorio).filter(Directorio.tipo == "especialista").all()

    @staticmethod
    def get_especialistas_by_juzgado(db: Session, juzgado_id: int) -> List[Directorio]:
        """Obtener especialistas vinculados a un juzgado"""
        return db.query(Directorio).filter(
            and_(
                Directorio.tipo == "especialista",
                Directorio.juzgado_id == juzgado_id
            )
        ).all()

    @staticmethod
    def update_directorio(db: Session, directorio_id: int, directorio_data: DirectorioUpdate) -> Optional[Directorio]:
        """Actualizar un registro"""
        directorio = db.query(Directorio).filter(Directorio.id == directorio_id).first()
        if not directorio:
            return None
        
        update_data = directorio_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(directorio, field, value)
        
        db.commit()
        db.refresh(directorio)
        return directorio

    @staticmethod
    def delete_directorio(db: Session, directorio_id: int) -> bool:
        """Eliminar un registro (soft delete por defecto)"""
        directorio = db.query(Directorio).filter(Directorio.id == directorio_id).first()
        if not directorio:
            return False
        
        # Soft delete - solo marcar como inactivo
        directorio.activo = False
        db.commit()
        return True

    @staticmethod
    def hard_delete_directorio(db: Session, directorio_id: int) -> bool:
        """Eliminar permanentemente un registro (no recomendado)"""
        directorio = db.query(Directorio).filter(Directorio.id == directorio_id).first()
        if not directorio:
            return False
        
        db.delete(directorio)
        db.commit()
        return True

    @staticmethod
    def get_cliente_by_doc(db: Session, doc_tipo: str, doc_numero: str) -> Optional[Directorio]:
        """Obtener cliente por tipo y número de documento"""
        return db.query(Directorio).filter(
            and_(
                Directorio.tipo == "cliente",
                Directorio.doc_tipo == doc_tipo,
                Directorio.doc_numero == doc_numero
            )
        ).first()

    @staticmethod
    def get_activos(db: Session, tipo: Optional[str] = None) -> List[Directorio]:
        """Obtener solo registros activos"""
        query = db.query(Directorio).filter(Directorio.activo == True)
        if tipo:
            query = query.filter(Directorio.tipo == tipo)
        return query.all()

    @staticmethod
    def count_by_tipo(db: Session) -> dict:
        """Contar registros por tipo"""
        from sqlalchemy import func
        result = db.query(
            Directorio.tipo,
            func.count(Directorio.id).label('count')
        ).group_by(Directorio.tipo).all()
        return {row[0]: row[1] for row in result}
