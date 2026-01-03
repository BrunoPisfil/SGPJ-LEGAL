from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from backend.app.models.cliente import Cliente
from backend.app.schemas.cliente import ClienteCreate, ClienteUpdate, ClienteListParams


class ClienteService:
    
    @staticmethod
    def get_all(db: Session, params: ClienteListParams) -> List[Cliente]:
        """Obtener todos los clientes con filtros opcionales"""
        query = db.query(Cliente)
        
        # Aplicar filtro de búsqueda si existe
        if params.search:
            search_term = f"%{params.search}%"
            query = query.filter(
                or_(
                    Cliente.nombres.ilike(search_term),
                    Cliente.apellidos.ilike(search_term),
                    Cliente.razon_social.ilike(search_term),
                    Cliente.doc_numero.ilike(search_term),
                    Cliente.email.ilike(search_term)
                )
            )
        
        # Aplicar filtro por tipo de persona
        if params.tipo_persona:
            query = query.filter(Cliente.tipo_persona == params.tipo_persona)
        
        # Aplicar filtro por estado activo
        if params.activo is not None:
            query = query.filter(Cliente.activo == params.activo)
        
        # Ordenar por fecha de creación descendente
        query = query.order_by(Cliente.created_at.desc())
        
        # Aplicar paginación
        return query.offset(params.skip).limit(params.limit).all()
    
    @staticmethod
    def get_by_id(db: Session, cliente_id: int) -> Optional[Cliente]:
        """Obtener cliente por ID"""
        return db.query(Cliente).filter(Cliente.id == cliente_id).first()
    
    @staticmethod
    def get_by_documento(db: Session, doc_numero: str) -> Optional[Cliente]:
        """Obtener cliente por número de documento"""
        return db.query(Cliente).filter(Cliente.doc_numero == doc_numero).first()
    
    @staticmethod
    def create(db: Session, cliente_data: ClienteCreate) -> Cliente:
        """Crear nuevo cliente"""
        
        # Verificar si ya existe un cliente con ese documento
        existing_cliente = ClienteService.get_by_documento(db, cliente_data.doc_numero)
        if existing_cliente:
            raise ValueError(f"Ya existe un cliente con el documento {cliente_data.doc_numero}")
        
        # Validar datos según el tipo de persona
        if cliente_data.tipo_persona == "natural":
            if not cliente_data.nombres or not cliente_data.apellidos:
                raise ValueError("Para personas naturales son obligatorios nombres y apellidos")
        elif cliente_data.tipo_persona == "juridica":
            if not cliente_data.razon_social:
                raise ValueError("Para personas jurídicas es obligatoria la razón social")
        
        # Crear nuevo cliente
        db_cliente = Cliente(**cliente_data.model_dump())
        db.add(db_cliente)
        db.commit()
        db.refresh(db_cliente)
        
        return db_cliente
    
    @staticmethod
    def update(db: Session, cliente_id: int, cliente_data: ClienteUpdate) -> Optional[Cliente]:
        """Actualizar cliente existente"""
        cliente = ClienteService.get_by_id(db, cliente_id)
        
        if not cliente:
            return None
        
        # Verificar si se está cambiando el documento y ya existe otro cliente con ese documento
        if cliente_data.doc_numero and cliente_data.doc_numero != cliente.doc_numero:
            existing_cliente = ClienteService.get_by_documento(db, cliente_data.doc_numero)
            if existing_cliente and existing_cliente.id != cliente_id:
                raise ValueError(f"Ya existe otro cliente con el documento {cliente_data.doc_numero}")
        
        # Actualizar solo los campos proporcionados
        update_data = cliente_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(cliente, field, value)
        
        db.commit()
        db.refresh(cliente)
        
        return cliente
    
    @staticmethod
    def delete(db: Session, cliente_id: int) -> bool:
        """Eliminar cliente (soft delete)"""
        cliente = ClienteService.get_by_id(db, cliente_id)
        
        if not cliente:
            return False
        
        cliente.activo = False
        db.commit()
        
        return True
    
    @staticmethod
    def get_count(db: Session, params: ClienteListParams) -> int:
        """Obtener el total de clientes que coinciden con los filtros"""
        query = db.query(Cliente)
        
        # Aplicar mismos filtros que en get_all
        if params.search:
            search_term = f"%{params.search}%"
            query = query.filter(
                or_(
                    Cliente.nombres.ilike(search_term),
                    Cliente.apellidos.ilike(search_term),
                    Cliente.razon_social.ilike(search_term),
                    Cliente.doc_numero.ilike(search_term),
                    Cliente.email.ilike(search_term)
                )
            )
        
        if params.tipo_persona:
            query = query.filter(Cliente.tipo_persona == params.tipo_persona)
        
        if params.activo is not None:
            query = query.filter(Cliente.activo == params.activo)
        
        return query.count()