"""
Endpoints para bitácora de procesos
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.bitacora_proceso import BitacoraProceso
from app.models.usuario import Usuario
from app.models.proceso import Proceso
from app.schemas.bitacora_proceso import (
    BitacoraProcesoCreate, 
    BitacoraProcesoResponse, 
    BitacoraProcesoDetalle
)
from app.api.dependencies import get_current_user

router = APIRouter()


@router.get("/test")
async def test_bitacora():
    """Endpoint de prueba para bitácora"""
    return {"message": "Bitácora endpoint funcionando", "status": "OK"}


@router.get("/{proceso_id}/bitacora", response_model=List[BitacoraProcesoResponse])
async def get_bitacora_proceso(
    proceso_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener historial de cambios de un proceso"""
    
    try:
        print(f"🔍 Solicitando bitácora para proceso: {proceso_id}")
        print(f"👤 Usuario actual: {current_user.email if current_user else 'None'}")
        
        # Verificar que el proceso existe
        proceso = db.query(Proceso).filter(Proceso.id == proceso_id).first()
        if not proceso:
            print(f"❌ Proceso {proceso_id} no encontrado")
            raise HTTPException(status_code=404, detail="Proceso no encontrado")
        
        print(f"✅ Proceso {proceso_id} encontrado")
        
        # Obtener bitácora ordenada por fecha descendente
        bitacora_query = db.query(BitacoraProceso).filter(
            BitacoraProceso.proceso_id == proceso_id
        ).order_by(desc(BitacoraProceso.fecha_cambio))
        
        bitacora_entries = bitacora_query.all()
        print(f"📊 Encontradas {len(bitacora_entries)} entradas de bitácora")
        
        # Construir respuesta con información del usuario
        result = []
        for entry in bitacora_entries:
            try:
                usuario_nombre = "Sistema"
                if entry.usuario_id:
                    usuario = db.query(Usuario).filter(Usuario.id == entry.usuario_id).first()
                    if usuario:
                        usuario_nombre = f"{usuario.nombre}".strip()
                
                result.append(BitacoraProcesoResponse(
                    id=entry.id,
                    proceso_id=entry.proceso_id,
                    usuario_id=entry.usuario_id,
                    accion=entry.accion,
                    campo_modificado=entry.campo_modificado,
                    valor_anterior=entry.valor_anterior,
                    valor_nuevo=entry.valor_nuevo,
                    descripcion=entry.descripcion,
                    fecha_cambio=entry.fecha_cambio,
                    usuario_nombre=usuario_nombre
                ))
            except Exception as e:
                print(f"❌ Error procesando entrada de bitácora {entry.id}: {e}")
                continue
        
        print(f"🚀 Devolviendo {len(result)} entradas de bitácora")
        return result
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"❌ Error interno en endpoint de bitácora: {e}")
        print(f"❌ Tipo de error: {type(e).__name__}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.post("/{proceso_id}/bitacora", response_model=BitacoraProcesoResponse)
async def create_bitacora_entry(
    proceso_id: int,
    bitacora_data: BitacoraProcesoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Crear nueva entrada en la bitácora"""
    
    # Verificar que el proceso existe
    proceso = db.query(Proceso).filter(Proceso.id == proceso_id).first()
    if not proceso:
        raise HTTPException(status_code=404, detail="Proceso no encontrado")
    
    # Crear entrada de bitácora
    bitacora_entry = BitacoraProceso(
        proceso_id=proceso_id,
        usuario_id=bitacora_data.usuario_id or current_user.id,
        accion=bitacora_data.accion,
        campo_modificado=bitacora_data.campo_modificado,
        valor_anterior=bitacora_data.valor_anterior,
        valor_nuevo=bitacora_data.valor_nuevo,
        descripcion=bitacora_data.descripcion
    )
    
    db.add(bitacora_entry)
    db.commit()
    db.refresh(bitacora_entry)
    
    # Obtener nombre del usuario
    usuario_nombre = f"{current_user.nombres} {current_user.apellidos}".strip()
    
    return BitacoraProcesoResponse(
        id=bitacora_entry.id,
        proceso_id=bitacora_entry.proceso_id,
        usuario_id=bitacora_entry.usuario_id,
        accion=bitacora_entry.accion,
        campo_modificado=bitacora_entry.campo_modificado,
        valor_anterior=bitacora_entry.valor_anterior,
        valor_nuevo=bitacora_entry.valor_nuevo,
        descripcion=bitacora_entry.descripcion,
        fecha_cambio=bitacora_entry.fecha_cambio,
        usuario_nombre=usuario_nombre
    )