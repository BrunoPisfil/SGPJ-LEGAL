from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.usuario import Usuario
from app.models.parte_proceso import ParteProceso
from app.schemas.directorio import DirectorioCreate, DirectorioUpdate, DirectorioResponse
from app.services.directorio import DirectorioService
from app.api.permissions import require_permission

router = APIRouter(tags=["directorio"])


@router.get("/estadisticas", response_model=dict)
async def get_estadisticas(
    db: Session = Depends(get_db)
):
    """Obtener estadísticas del directorio"""
    stats = DirectorioService.count_by_tipo(db)
    return {
        "por_tipo": stats,
        "total": sum(stats.values())
    }


@router.get("/buscar", response_model=list[DirectorioResponse])
async def search_directorio(
    q: str = Query(..., min_length=1),
    tipo: str = Query(None),
    db: Session = Depends(get_db)
):
    """Buscar registros del directorio"""
    return DirectorioService.search_directorio(db, q, tipo)


@router.get("/clientes", response_model=list[DirectorioResponse])
async def get_clientes(
    db: Session = Depends(get_db)
):
    """Obtener solo clientes"""
    clientes = DirectorioService.get_directorio_by_tipo(db, "cliente")
    print(f"🔍 Retornando {len(clientes)} clientes")
    return clientes


@router.get("/juzgados", response_model=list[DirectorioResponse])
async def get_juzgados(
    db: Session = Depends(get_db)
):
    """Obtener solo juzgados"""
    return DirectorioService.get_directorio_by_tipo(db, "juzgado")


@router.get("/especialistas", response_model=list[DirectorioResponse])
async def get_especialistas(
    db: Session = Depends(get_db)
):
    """Obtener solo especialistas"""
    return DirectorioService.get_directorio_by_tipo(db, "especialista")


@router.get("/", response_model=list[DirectorioResponse])
async def list_directorio(
    skip: int = Query(0),
    limit: int = Query(100),
    tipo: str = Query(None),
    db: Session = Depends(get_db)
):
    """Obtener todos los registros del directorio"""
    if tipo:
        return DirectorioService.get_directorio_by_tipo(db, tipo)
    return DirectorioService.get_all_directorio(db, skip, limit)


@router.get("/{cliente_id}/procesos", response_model=list)
async def get_cliente_procesos(
    cliente_id: int,
    db: Session = Depends(get_db)
):
    """Obtener los procesos en los que participa un cliente del directorio"""
    # Verificar que el cliente existe
    directorio = DirectorioService.get_directorio_by_id(db, cliente_id)
    if not directorio or directorio.get("tipo") != "cliente":
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Obtener las partes del proceso donde este cliente participa
    partes = db.query(ParteProceso).filter(
        ParteProceso.cliente_id == cliente_id
    ).all()
    
    result = []
    for parte in partes:
        result.append({
            "proceso_id": parte.proceso_id,
            "expediente": parte.proceso.expediente if parte.proceso else "Desconocido",
            "tipo_parte": parte.tipo_parte,
            "es_nuestro_cliente": parte.es_nuestro_cliente,
        })
    
    return result


@router.get("/{directorio_id}", response_model=DirectorioResponse)
async def get_directorio_by_id(
    directorio_id: int,
    db: Session = Depends(get_db)
):
    """Obtener un registro del directorio por ID"""
    directorio = DirectorioService.get_directorio_by_id(db, directorio_id)
    if not directorio:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return directorio


@router.post("/", response_model=DirectorioResponse)
async def create_directorio(
    directorio_data: DirectorioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Crear un nuevo registro en el directorio - Admin y practicantes pueden agregar"""
    # Validar duplicados para clientes
    if directorio_data.tipo == "cliente" and directorio_data.doc_numero:
        existing = DirectorioService.get_cliente_by_doc(
            db, directorio_data.doc_tipo, directorio_data.doc_numero
        )
        if existing:
            raise HTTPException(status_code=400, detail="Cliente con este documento ya existe")
    
    return DirectorioService.create_directorio(db, directorio_data)


@router.put("/{directorio_id}", response_model=DirectorioResponse)
async def update_directorio(
    directorio_id: int,
    directorio_data: DirectorioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Actualizar un registro del directorio"""
    directorio = DirectorioService.get_directorio_by_id(db, directorio_id)
    if not directorio:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    
    updated = DirectorioService.update_directorio(db, directorio_id, directorio_data)
    return updated


@router.delete("/{directorio_id}")
async def delete_directorio(
    directorio_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Eliminar un registro del directorio (soft delete) - Solo admin puede eliminar"""
    directorio = DirectorioService.get_directorio_by_id(db, directorio_id)
    if not directorio:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    
    DirectorioService.delete_directorio(db, directorio_id)
    return {"message": "Registro eliminado"}
