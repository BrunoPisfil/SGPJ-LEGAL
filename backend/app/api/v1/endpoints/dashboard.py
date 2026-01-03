from fastapi import APIRouter

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats():
    """Obtener estadísticas del dashboard"""
    return {
        "procesos_activos": 45,
        "audiencias_proximas": 12,
        "cobros_pendientes": 8,
        "total_ingresos": 150000.00
    }


@router.get("/procesos-status")
async def get_procesos_by_status():
    """Obtener procesos agrupados por estado"""
    return {
        "activos": 25,
        "en_espera": 15,
        "finalizados": 5,
        "archivados": 10
    }


@router.get("/audiencias-proximas")
async def get_upcoming_audiencias():
    """Obtener próximas audiencias"""
    return {"message": "Próximas audiencias - Por implementar"}