from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from typing import Optional, List
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models.contrato import Contrato
from app.models.cliente import Cliente
from app.models.proceso import Proceso
from app.models.pago import Pago
from app.schemas.contrato import (
    ContratoCreate, ContratoUpdate, Contrato as ContratoSchema,
    ContratoDetalle, ContratoStats, ContratoListResponse, ContratoSearch
)
from app.schemas.pago import PagoCreate, PagoUpdate, PagoSchema, PagoDetalle

router = APIRouter()


def generate_contrato_code() -> str:
    """Generar código único para contrato"""
    now = datetime.now()
    year = now.year
    month = str(now.month).zfill(2)
    day = str(now.day).zfill(2)
    time_part = str(now.microsecond)[:4]
    return f"CTR-{year}{month}{day}-{time_part}"


def get_proceso_partes(proceso: Proceso) -> tuple:
    """Obtener demandantes y demandados de un proceso normalizado"""
    demandantes = []
    demandados = []
    
    if proceso and hasattr(proceso, 'partes') and proceso.partes:
        for parte in proceso.partes:
            if parte.tipo_parte == "demandante":
                demandantes.append(parte.nombre_completo)
            elif parte.tipo_parte == "demandado":
                demandados.append(parte.nombre_completo)
    
    demandante = demandantes[0] if demandantes else "Sin demandante"
    demandado = demandados[0] if demandados else "Sin demandado"
    
    return demandante, demandado


@router.get("/", response_model=ContratoListResponse)
async def get_contratos(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    cliente_id: Optional[int] = None,
    proceso_id: Optional[int] = None,
    estado: Optional[str] = None,
    fecha_desde: Optional[datetime] = None,
    fecha_hasta: Optional[datetime] = None
):
    """Obtener lista de contratos con filtros"""
    query = db.query(Contrato).options(
        joinedload(Contrato.cliente),
        joinedload(Contrato.proceso)
    )
    
    # Aplicar filtros
    if cliente_id:
        query = query.filter(Contrato.cliente_id == cliente_id)
    if proceso_id:
        query = query.filter(Contrato.proceso_id == proceso_id)
    if estado:
        query = query.filter(Contrato.estado == estado)
    if fecha_desde:
        query = query.filter(Contrato.fecha_creacion >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Contrato.fecha_creacion <= fecha_hasta)
    
    # Contar total
    total = query.count()
    
    # Aplicar paginación
    contratos = query.offset(skip).limit(limit).all()
    
    # Preparar datos expandidos
    contratos_detalle = []
    for contrato in contratos:
        contrato_dict = {
            "id": contrato.id,
            "codigo": contrato.codigo,
            "cliente_id": contrato.cliente_id,
            "proceso_id": contrato.proceso_id,
            "monto_total": contrato.monto_total,
            "monto_pagado": contrato.monto_pagado,
            "estado": contrato.estado,
            "notas": contrato.notas,
            "fecha_creacion": contrato.fecha_creacion,
            "fecha_actualizacion": contrato.fecha_actualizacion,
            "monto_pendiente": contrato.monto_pendiente,
            "porcentaje_pagado": contrato.porcentaje_pagado,
            "esta_completado": contrato.esta_completado,
        }
        
        # Agregar información del cliente
        if contrato.cliente:
            if contrato.cliente.tipo_persona == 'natural':
                contrato_dict["cliente_nombre"] = f"{contrato.cliente.nombres} {contrato.cliente.apellidos}".strip()
            else:
                contrato_dict["cliente_nombre"] = contrato.cliente.razon_social
            contrato_dict["cliente_documento"] = f"{contrato.cliente.doc_tipo}: {contrato.cliente.doc_numero}"
        
        # Agregar información del proceso
        if contrato.proceso:
            contrato_dict["proceso_expediente"] = contrato.proceso.expediente
            demandante, demandado = get_proceso_partes(contrato.proceso)
            contrato_dict["proceso_demandante"] = demandante
            contrato_dict["proceso_demandado"] = demandado
        
        contratos_detalle.append(ContratoDetalle(**contrato_dict))
    
    pages = (total + limit - 1) // limit
    
    return ContratoListResponse(
        contratos=contratos_detalle,
        total=total,
        page=skip // limit + 1,
        size=limit,
        pages=pages
    )


@router.post("/contratos", response_model=ContratoSchema)
async def create_contrato(
    contrato_data: ContratoCreate,
    db: Session = Depends(get_db)
):
    """Crear nuevo contrato"""
    # Verificar que el cliente existe
    cliente = db.query(Cliente).filter(Cliente.id == contrato_data.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Verificar que el proceso existe
    proceso = db.query(Proceso).filter(Proceso.id == contrato_data.proceso_id).first()
    if not proceso:
        raise HTTPException(status_code=404, detail="Proceso no encontrado")
    
    # Generar código único
    codigo = generate_contrato_code()
    
    # Crear contrato
    db_contrato = Contrato(
        codigo=codigo,
        cliente_id=contrato_data.cliente_id,
        proceso_id=contrato_data.proceso_id,
        monto_total=contrato_data.monto_total,
        monto_pagado=contrato_data.monto_pagado,
        estado=contrato_data.estado,
        notas=contrato_data.notas
    )
    
    db.add(db_contrato)
    db.commit()
    db.refresh(db_contrato)
    
    return db_contrato


@router.get("/contratos/stats", response_model=ContratoStats)
async def get_contratos_stats(db: Session = Depends(get_db)):
    """Obtener estadísticas de contratos"""
    # Consulta base
    query = db.query(Contrato)
    
    # Contar totales
    total = query.count()
    activos = query.filter(Contrato.estado == 'activo').count()
    completados = query.filter(Contrato.estado == 'completado').count()
    cancelados = query.filter(Contrato.estado == 'cancelado').count()
    
    # Sumar montos
    montos = db.query(
        func.sum(Contrato.monto_total).label('total'),
        func.sum(Contrato.monto_pagado).label('pagado')
    ).first()
    
    monto_total = montos.total or 0
    monto_pagado = montos.pagado or 0
    monto_pendiente = monto_total - monto_pagado
    porcentaje_cobrado = (monto_pagado / monto_total * 100) if monto_total > 0 else 0
    
    return ContratoStats(
        total=total,
        activos=activos,
        completados=completados,
        cancelados=cancelados,
        monto_total=monto_total,
        monto_pagado=monto_pagado,
        monto_pendiente=monto_pendiente,
        porcentaje_cobrado=porcentaje_cobrado
    )


@router.get("/contratos/search", response_model=List[ContratoDetalle])
async def search_contratos(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    """Buscar contratos por texto"""
    # Buscar en código, nombre del cliente, expediente
    contratos = db.query(Contrato).options(
        joinedload(Contrato.cliente),
        joinedload(Contrato.proceso)
    ).join(Cliente).join(Proceso).filter(
        or_(
            Contrato.codigo.contains(q),
            Proceso.expediente.contains(q),
            Cliente.nombres.contains(q),
            Cliente.apellidos.contains(q),
            Cliente.razon_social.contains(q)
        )
    ).limit(20).all()
    
    # Preparar datos expandidos
    contratos_detalle = []
    for contrato in contratos:
        contrato_dict = {
            "id": contrato.id,
            "codigo": contrato.codigo,
            "cliente_id": contrato.cliente_id,
            "proceso_id": contrato.proceso_id,
            "monto_total": contrato.monto_total,
            "monto_pagado": contrato.monto_pagado,
            "estado": contrato.estado,
            "notas": contrato.notas,
            "fecha_creacion": contrato.fecha_creacion,
            "fecha_actualizacion": contrato.fecha_actualizacion,
            "monto_pendiente": contrato.monto_pendiente,
            "porcentaje_pagado": contrato.porcentaje_pagado,
            "esta_completado": contrato.esta_completado,
        }
        
        # Agregar información del cliente
        if contrato.cliente:
            if contrato.cliente.tipo_persona == 'natural':
                contrato_dict["cliente_nombre"] = f"{contrato.cliente.nombres} {contrato.cliente.apellidos}".strip()
            else:
                contrato_dict["cliente_nombre"] = contrato.cliente.razon_social
            contrato_dict["cliente_documento"] = f"{contrato.cliente.doc_tipo}: {contrato.cliente.doc_numero}"
        
        # Agregar información del proceso
        if contrato.proceso:
            contrato_dict["proceso_expediente"] = contrato.proceso.expediente
            demandante, demandado = get_proceso_partes(contrato.proceso)
            contrato_dict["proceso_demandante"] = demandante
            contrato_dict["proceso_demandado"] = demandado
        
        contratos_detalle.append(ContratoDetalle(**contrato_dict))
    
    return contratos_detalle


@router.get("/contratos/{contrato_id}", response_model=ContratoDetalle)
async def get_contrato(contrato_id: int, db: Session = Depends(get_db)):
    """Obtener contrato por ID"""
    contrato = db.query(Contrato).options(
        joinedload(Contrato.cliente),
        joinedload(Contrato.proceso)
    ).filter(Contrato.id == contrato_id).first()
    
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    
    # Preparar datos expandidos
    contrato_dict = {
        "id": contrato.id,
        "codigo": contrato.codigo,
        "cliente_id": contrato.cliente_id,
        "proceso_id": contrato.proceso_id,
        "monto_total": contrato.monto_total,
        "monto_pagado": contrato.monto_pagado,
        "estado": contrato.estado,
        "notas": contrato.notas,
        "fecha_creacion": contrato.fecha_creacion,
        "fecha_actualizacion": contrato.fecha_actualizacion,
        "monto_pendiente": contrato.monto_pendiente,
        "porcentaje_pagado": contrato.porcentaje_pagado,
        "esta_completado": contrato.esta_completado,
    }
    
    # Agregar información del cliente
    if contrato.cliente:
        if contrato.cliente.tipo_persona == 'natural':
            contrato_dict["cliente_nombre"] = f"{contrato.cliente.nombres} {contrato.cliente.apellidos}".strip()
        else:
            contrato_dict["cliente_nombre"] = contrato.cliente.razon_social
        contrato_dict["cliente_documento"] = f"{contrato.cliente.doc_tipo}: {contrato.cliente.doc_numero}"
    
    # Agregar información del proceso
    if contrato.proceso:
        contrato_dict["proceso_expediente"] = contrato.proceso.expediente
        demandante, demandado = get_proceso_partes(contrato.proceso)
        contrato_dict["proceso_demandante"] = demandante
        contrato_dict["proceso_demandado"] = demandado
    
    return ContratoDetalle(**contrato_dict)


@router.put("/contratos/{contrato_id}", response_model=ContratoSchema)
async def update_contrato(
    contrato_id: int,
    contrato_data: ContratoUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar contrato"""
    contrato = db.query(Contrato).filter(Contrato.id == contrato_id).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    
    # Actualizar campos
    update_data = contrato_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contrato, field, value)
    
    db.commit()
    db.refresh(contrato)
    
    return contrato


@router.delete("/contratos/{contrato_id}")
async def delete_contrato(contrato_id: int, db: Session = Depends(get_db)):
    """Eliminar contrato"""
    contrato = db.query(Contrato).filter(Contrato.id == contrato_id).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    
    db.delete(contrato)
    db.commit()
    
    return {"message": "Contrato eliminado exitosamente"}


@router.get("/cobros")
async def get_cobros():
    """Obtener lista de cobros"""
    return {"message": "Lista de cobros - Por implementar"}


@router.post("/cobros")
async def create_cobro():
    """Crear nuevo cobro"""
    return {"message": "Crear cobro - Por implementar"}


@router.get("/contratos/{contrato_id}/pagos", response_model=List[PagoDetalle])
async def get_pagos_contrato(
    contrato_id: int,
    db: Session = Depends(get_db)
):
    """Obtener pagos de un contrato específico"""
    # Verificar que el contrato existe
    contrato = db.query(Contrato).filter(Contrato.id == contrato_id).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    
    # Obtener pagos del contrato
    pagos = db.query(Pago).options(
        joinedload(Pago.contrato).joinedload(Contrato.cliente)
    ).filter(Pago.contrato_id == contrato_id).order_by(Pago.fecha_pago.desc()).all()
    
    # Preparar datos expandidos
    pagos_detalle = []
    for pago in pagos:
        pago_dict = {
            "id": pago.id,
            "contrato_id": pago.contrato_id,
            "monto": pago.monto,
            "medio": pago.medio,
            "referencia": pago.referencia,
            "notas": pago.notas,
            "fecha_pago": pago.fecha_pago,
            "created_at": pago.created_at,
            "updated_at": pago.updated_at,
            "contrato_codigo": pago.contrato.codigo if pago.contrato else None,
        }
        
        # Agregar información del cliente
        if pago.contrato and pago.contrato.cliente:
            if pago.contrato.cliente.tipo_persona == 'natural':
                pago_dict["cliente_nombre"] = f"{pago.contrato.cliente.nombres} {pago.contrato.cliente.apellidos}".strip()
            else:
                pago_dict["cliente_nombre"] = pago.contrato.cliente.razon_social
        
        pagos_detalle.append(PagoDetalle(**pago_dict))
    
    return pagos_detalle


@router.post("/contratos/{contrato_id}/pagos", response_model=PagoSchema)
async def create_pago(
    contrato_id: int,
    pago_data: PagoCreate,
    db: Session = Depends(get_db)
):
    """Crear nuevo pago para un contrato"""
    # Verificar que el contrato existe
    contrato = db.query(Contrato).filter(Contrato.id == contrato_id).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    
    # Crear el pago
    db_pago = Pago(
        contrato_id=contrato_id,
        monto=pago_data.monto,
        medio=pago_data.medio,
        referencia=pago_data.referencia,
        notas=pago_data.notas,
        fecha_pago=pago_data.fecha_pago or datetime.now().date()
    )
    
    db.add(db_pago)
    
    # Actualizar el monto pagado del contrato
    total_pagado = db.query(func.sum(Pago.monto)).filter(Pago.contrato_id == contrato_id).scalar() or 0
    total_pagado += float(pago_data.monto)
    
    contrato.monto_pagado = total_pagado
    contrato.fecha_actualizacion = datetime.now()
    
    # Si el monto pagado es igual o mayor al monto total, marcar como completado
    if total_pagado >= float(contrato.monto_total):
        contrato.estado = 'completado'
    
    db.commit()
    db.refresh(db_pago)
    
    return db_pago


@router.get("/pagos", response_model=List[PagoDetalle])
async def get_pagos(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    contrato_id: Optional[int] = None
):
    """Obtener lista de todos los pagos"""
    query = db.query(Pago).options(
        joinedload(Pago.contrato).joinedload(Contrato.cliente)
    )
    
    # Filtrar por contrato si se especifica
    if contrato_id:
        query = query.filter(Pago.contrato_id == contrato_id)
    
    # Aplicar paginación y ordenar por fecha
    pagos = query.order_by(Pago.fecha_pago.desc()).offset(skip).limit(limit).all()
    
    # Preparar datos expandidos
    pagos_detalle = []
    for pago in pagos:
        pago_dict = {
            "id": pago.id,
            "contrato_id": pago.contrato_id,
            "monto": pago.monto,
            "medio": pago.medio,
            "referencia": pago.referencia,
            "notas": pago.notas,
            "fecha_pago": pago.fecha_pago,
            "created_at": pago.created_at,
            "updated_at": pago.updated_at,
            "contrato_codigo": pago.contrato.codigo if pago.contrato else None,
        }
        
        # Agregar información del cliente
        if pago.contrato and pago.contrato.cliente:
            if pago.contrato.cliente.tipo_persona == 'natural':
                pago_dict["cliente_nombre"] = f"{pago.contrato.cliente.nombres} {pago.contrato.cliente.apellidos}".strip()
            else:
                pago_dict["cliente_nombre"] = pago.contrato.cliente.razon_social
        
        pagos_detalle.append(PagoDetalle(**pago_dict))
    
    return pagos_detalle