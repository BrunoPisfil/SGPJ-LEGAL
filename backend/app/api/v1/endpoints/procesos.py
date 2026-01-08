from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.proceso import Proceso
from app.schemas.proceso import ProcesoResponse, ProcesoCreate, ProcesoUpdate
from app.api.dependencies import get_current_user
from app.models.usuario import Usuario
from app.api.permissions import require_permission, check_permission

router = APIRouter()


def proceso_to_response(proceso: Proceso) -> dict:
    """Convierte un modelo Proceso a diccionario para respuesta API"""
    # Obtener listas de nombres de partes
    demandantes_nombres = [parte.nombre_mostrar for parte in proceso.demandantes]
    demandados_nombres = [parte.nombre_mostrar for parte in proceso.demandados]
    
    return {
        "id": proceso.id,
        "expediente": proceso.expediente,
        "tipo": proceso.tipo,
        "materia": proceso.materia,
        "estado": proceso.estado,
        "estado_juridico": proceso.estado_juridico,
        "monto_pretension": proceso.monto_pretension,
        "fecha_inicio": proceso.fecha_inicio,
        "fecha_notificacion": proceso.fecha_notificacion,
        "fecha_ultima_revision": proceso.fecha_ultima_revision,
        "observaciones": proceso.observaciones,
        "abogado_responsable_id": proceso.abogado_responsable_id,
        "created_at": proceso.created_at,
        "updated_at": proceso.updated_at,
        # Nuevos campos normalizados
        "juzgado_nombre": proceso.juzgado_nombre,
        "juez_nombre": proceso.juez_nombre,
        "demandantes": demandantes_nombres,
        "demandados": demandados_nombres,
        # Campos concatenados para el frontend
        "demandantes_nombres": ", ".join(demandantes_nombres) if demandantes_nombres else "Sin demandantes",
        "demandados_nombres": ", ".join(demandados_nombres) if demandados_nombres else "Sin demandados",
        # Campos de compatibilidad
        "demandante": demandantes_nombres[0] if demandantes_nombres else "Sin demandante",
        "demandado": demandados_nombres[0] if demandados_nombres else "Sin demandado",
        "juzgado": proceso.juzgado_nombre,
        "juez": proceso.juez_nombre,
    }


@router.get("/", response_model=List[ProcesoResponse])
async def get_procesos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    estado: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Obtener lista de procesos"""
    query = db.query(Proceso)
    
    # Filtrar por estado si se proporciona
    if estado:
        query = query.filter(Proceso.estado == estado)
    
    # Paginación
    procesos = query.offset(skip).limit(limit).all()
    
    # Transformar a la estructura de respuesta esperada
    return [proceso_to_response(proceso) for proceso in procesos]


@router.post("/", response_model=ProcesoResponse)
async def create_proceso(
    proceso: ProcesoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Crear nuevo proceso"""
    # Verificar que el expediente no exista
    existing = db.query(Proceso).filter(Proceso.expediente == proceso.expediente).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un proceso con el expediente {proceso.expediente}"
        )
    
    # Buscar o crear juzgado
    juzgado_id = None
    if proceso.juzgado:
        from app.models.juzgado import Juzgado
        juzgado = db.query(Juzgado).filter(Juzgado.nombre == proceso.juzgado).first()
        if not juzgado:
            # Crear juzgado si no existe
            juzgado = Juzgado(
                nombre=proceso.juzgado,
                distrito_judicial="Lima",  # Valor por defecto
                creado_por=current_user.id
            )
            db.add(juzgado)
            db.flush()
        juzgado_id = juzgado.id
    
    # Buscar o crear especialista (juez)
    especialista_id = None
    if proceso.juez:
        from app.models.especialista import Especialista
        nombres_apellidos = proceso.juez.split(' ', 1)
        nombres = nombres_apellidos[0] if len(nombres_apellidos) > 0 else proceso.juez
        apellidos = nombres_apellidos[1] if len(nombres_apellidos) > 1 else ""
        
        especialista = db.query(Especialista).filter(
            Especialista.nombres == nombres,
            Especialista.apellidos == apellidos
        ).first()
        
        if not especialista:
            # Crear especialista si no existe
            especialista = Especialista(
                nombres=nombres,
                apellidos=apellidos,
                juzgado_id=juzgado_id
            )
            db.add(especialista)
            db.flush()
        especialista_id = especialista.id
    
    # Crear nuevo proceso con los campos correctos del modelo normalizado
    db_proceso = Proceso(
        expediente=proceso.expediente,
        tipo=proceso.tipo,
        materia=proceso.materia,
        juzgado_id=juzgado_id,
        especialista_id=especialista_id,
        estado=proceso.estado,
        monto_pretension=proceso.monto_pretension,
        fecha_inicio=proceso.fecha_inicio,
        fecha_notificacion=proceso.fecha_notificacion,
        fecha_ultima_revision=proceso.fecha_ultima_revision,
        observaciones=proceso.observaciones,
        abogado_responsable_id=current_user.id
    )
    
    db.add(db_proceso)
    db.flush()
    
    # Crear partes del proceso en la tabla partes_proceso
    from app.models.parte_proceso import ParteProceso
    
    # Crear demandante
    if proceso.demandante:
        demandante_parte = ParteProceso(
            proceso_id=db_proceso.id,
            tipo_parte="demandante",  # Minúscula según el enum
            tipo_persona="cliente",   # 'cliente' o 'entidad' según el enum
            cliente_id=None,  # No usar cliente_id ya que viene del directorio, no de la tabla clientes
            es_nuestro_cliente=True,  # Por ahora asumimos que es nuestro cliente
            nombre_completo=proceso.demandante
        )
        db.add(demandante_parte)
    
    # Crear demandado
    if proceso.demandado:
        demandado_parte = ParteProceso(
            proceso_id=db_proceso.id,
            tipo_parte="demandado",   # Minúscula según el enum
            tipo_persona="entidad",   # Asumimos que la parte contraria es entidad
            entidad_id=None,  # No usar entidad_id
            es_nuestro_cliente=False, # El demandado generalmente no es nuestro cliente
            nombre_completo=proceso.demandado
        )
        db.add(demandado_parte)
    
    db.commit()
    db.refresh(db_proceso)
    
    return proceso_to_response(db_proceso)


@router.get("/{proceso_id}", response_model=ProcesoResponse)
async def get_proceso(
    proceso_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener proceso por ID"""
    proceso = db.query(Proceso).filter(Proceso.id == proceso_id).first()
    
    if not proceso:
        raise HTTPException(status_code=404, detail="Proceso no encontrado")
    
    return proceso_to_response(proceso)


@router.put("/{proceso_id}", response_model=ProcesoResponse)
async def update_proceso(
    proceso_id: int,
    proceso_update: ProcesoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Actualizar proceso - Solo admin puede editar"""
    proceso = db.query(Proceso).filter(Proceso.id == proceso_id).first()
    
    if not proceso:
        raise HTTPException(status_code=404, detail="Proceso no encontrado")
    
    # Actualizar campos válidos de la tabla proceso
    update_data = proceso_update.dict(exclude_unset=True)
    
    # Importar modelo de bitácora
    from app.models.bitacora_proceso import BitacoraProceso
    
    # Campos que se pueden actualizar directamente
    valid_fields = ['tipo', 'materia', 'estado', 'estado_juridico', 'monto_pretension', 
                   'fecha_inicio', 'fecha_notificacion', 'fecha_ultima_revision', 'observaciones']
    
    # Registrar cambios en bitácora
    for field, value in update_data.items():
        if field in valid_fields and hasattr(proceso, field):
            valor_anterior = getattr(proceso, field)
            if valor_anterior != value:
                # Crear entrada en bitácora
                bitacora_entry = BitacoraProceso(
                    proceso_id=proceso_id,
                    usuario_id=current_user.id,
                    accion="actualizacion",
                    campo_modificado=field,
                    valor_anterior=str(valor_anterior) if valor_anterior else None,
                    valor_nuevo=str(value) if value else None,
                    descripcion=f"Campo '{field}' actualizado"
                )
                db.add(bitacora_entry)
            
            setattr(proceso, field, value)
    
    # Manejar expediente si se proporciona
    if 'expediente' in update_data:
        # Verificar que no exista otro proceso con el mismo expediente
        existing = db.query(Proceso).filter(
            Proceso.expediente == update_data['expediente'],
            Proceso.id != proceso_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe otro proceso con el expediente {update_data['expediente']}"
            )
        proceso.expediente = update_data['expediente']
    
    # TODO: Manejar actualización de demandante, demandado, juzgado (requiere lógica especial)
    # Por ahora, solo actualizamos campos básicos
    
    db.commit()
    db.refresh(proceso)
    
    return proceso_to_response(proceso)


@router.delete("/{proceso_id}")
async def delete_proceso(
    proceso_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Eliminar proceso y todas sus dependencias"""
    proceso = db.query(Proceso).filter(Proceso.id == proceso_id).first()
    
    if not proceso:
        raise HTTPException(status_code=404, detail="Proceso no encontrado")
    
    # Solo admin o el abogado responsable pueden eliminar
    if current_user.rol != "admin" and proceso.abogado_responsable_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="No tiene permisos para eliminar este proceso"
        )
    
    try:
        # El cascade="all, delete-orphan" en las relaciones se encargará de eliminar las dependencias
        db.delete(proceso)
        db.commit()
        return {"message": f"Proceso {proceso.expediente} y todas sus dependencias eliminados correctamente"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Error al eliminar el proceso: {str(e)}"
        )