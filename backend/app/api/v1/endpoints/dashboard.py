from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.usuario import Usuario
from app.models.proceso import Proceso
from app.models.audiencia import Audiencia
from app.models.contrato import Contrato
from app.models.pago import Pago
import pytz

router = APIRouter()
LIMA_TZ = pytz.timezone("America/Lima")


@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Estadísticas reales del dashboard"""
    now = datetime.now(LIMA_TZ).replace(tzinfo=None)
    proximos_7_dias = now + timedelta(days=7)

    procesos_activos = db.query(Proceso).filter(
        Proceso.estado.in_(["activo", "en_proceso", "en_espera"])
    ).count()

    audiencias_proximas = db.query(Audiencia).filter(
        Audiencia.fecha >= now,
        Audiencia.fecha <= proximos_7_dias,
        Audiencia.estado != "cancelada"
    ).count()

    cobros_pendientes = db.query(Contrato).filter(
        Contrato.estado == "pendiente"
    ).count()

    total_ingresos = db.query(
        func.coalesce(func.sum(Pago.monto), 0)
    ).scalar()

    return {
        "procesos_activos": procesos_activos,
        "audiencias_proximas": audiencias_proximas,
        "cobros_pendientes": cobros_pendientes,
        "total_ingresos": float(total_ingresos or 0),
    }


@router.get("/procesos-status")
async def get_procesos_by_status(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Procesos agrupados por estado"""
    resultados = db.query(
        Proceso.estado, func.count(Proceso.id)
    ).group_by(Proceso.estado).all()
    conteo = {estado: total for estado, total in resultados}
    return {
        "activos":     conteo.get("activo", 0) + conteo.get("en_proceso", 0),
        "en_espera":   conteo.get("en_espera", 0),
        "finalizados": conteo.get("finalizado", 0) + conteo.get("ganado", 0) + conteo.get("perdido", 0),
        "archivados":  conteo.get("archivado", 0),
    }


@router.get("/audiencias-proximas")
async def get_upcoming_audiencias(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Proximas 5 audiencias"""
    now = datetime.now(LIMA_TZ).replace(tzinfo=None)
    audiencias = db.query(Audiencia).filter(
        Audiencia.fecha >= now,
        Audiencia.estado != "cancelada"
    ).order_by(Audiencia.fecha.asc()).limit(5).all()

    return [
        {
            "id": a.id,
            "fecha": a.fecha.isoformat() if a.fecha else None,
            "tipo": getattr(a, "tipo", None),
            "estado": a.estado,
        }
        for a in audiencias
    ]
