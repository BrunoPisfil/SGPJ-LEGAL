from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.usuario import Usuario
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
            detail = (
                f"{existing.tipo.capitalize()} '{existing.nombre}' "
                f"({existing.doc_tipo}: {existing.doc_numero}) ya registrado en el sistema"
            )
            raise HTTPException(status_code=400, detail=detail)
    
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


# =========================================================
# NUEVOS ENDPOINTS para Juzgados Jerarquizados
# =========================================================

@router.get("/juzgados/distritos", response_model=list[dict])
async def get_distritos(
    db: Session = Depends(get_db)
):
    """Obtener todos los distritos judiciales"""
    result = db.execute(text("""
        SELECT id, codigo, nombre
        FROM distritos_judiciales
        ORDER BY codigo
    """)).fetchall()
    return [{"id": r[0], "codigo": r[1], "nombre": r[2]} for r in result]


@router.get("/juzgados/instancias", response_model=list[dict])
async def get_instancias(
    db: Session = Depends(get_db)
):
    """Obtener todas las instancias judiciales"""
    result = db.execute(text("""
        SELECT id, nombre, orden
        FROM instancias
        ORDER BY orden
    """)).fetchall()
    return [{"id": r[0], "nombre": r[1], "orden": r[2]} for r in result]


@router.get("/juzgados/especialidades-por-instancia/{instancia_id}", response_model=list[dict])
async def get_especialidades_por_instancia(
    instancia_id: int,
    db: Session = Depends(get_db)
):
    """Obtener especialidades de una instancia específica"""
    result = db.execute(text("""
        SELECT e.id, e.nombre
        FROM especialidades e
        JOIN instancia_especialidades ie ON ie.especialidad_id = e.id
        WHERE ie.instancia_id = :instancia_id
        ORDER BY e.nombre
    """), {"instancia_id": instancia_id}).fetchall()
    
    if not result:
        return []
    
    return [{"id": r[0], "nombre": r[1]} for r in result]


@router.get("/juzgados/filtrados", response_model=list[dict])
async def get_juzgados_filtrados(
    distrito_id: int = Query(None),
    instancia_id: int = Query(None),
    especialidad_id: int = Query(None),
    db: Session = Depends(get_db)
):
    """
    Obtener juzgados filtrados por distrito, instancia y especialidad
    Ejemplo: /api/v1/directorio/juzgados/filtrados?distrito_id=18&instancia_id=2&especialidad_id=1
    """
    query = """
        SELECT 
            d.id,
            d.nombre,
            dj.nombre AS distrito,
            i.nombre AS instancia,
            e.nombre AS especialidad,
            d.direccion,
            d.telefono,
            d.email
        FROM directorio d
        LEFT JOIN distritos_judiciales dj ON dj.id = d.distrito_judicial_id
        LEFT JOIN instancias i ON i.id = d.instancia_id
        LEFT JOIN especialidades e ON e.id = d.especialidad_id
        WHERE d.tipo = 'juzgado'
    """
    
    params = {}
    
    if distrito_id:
        query += " AND d.distrito_judicial_id = :distrito_id"
        params["distrito_id"] = distrito_id
    
    if instancia_id:
        query += " AND d.instancia_id = :instancia_id"
        params["instancia_id"] = instancia_id
    
    if especialidad_id:
        query += " AND d.especialidad_id = :especialidad_id"
        params["especialidad_id"] = especialidad_id
    
    query += " ORDER BY d.nombre"
    
    result = db.execute(text(query), params).fetchall()
    
    return [
        {
            "id": r[0],
            "nombre": r[1],
            "distrito": r[2],
            "instancia": r[3],
            "especialidad": r[4],
            "direccion": r[5],
            "telefono": r[6],
            "email": r[7],
        }
        for r in result
    ]


