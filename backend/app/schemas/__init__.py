# Schemas package
from .audiencia import (
    AudienciaBase, AudienciaCreate, AudienciaUpdate, 
    AudienciaResponse, AudienciaList
)
from .cliente import (
    ClienteCreate, ClienteUpdate, ClienteResponse
)
from .proceso import (
    ProcesoBase, ProcesoCreate, ProcesoUpdate, 
    ProcesoResponse
)

__all__ = [
    # Audiencia
    "AudienciaBase", "AudienciaCreate", "AudienciaUpdate", 
    "AudienciaResponse", "AudienciaList",
    # Cliente
    "ClienteCreate", "ClienteUpdate", "ClienteResponse",
    # Proceso
    "ProcesoBase", "ProcesoCreate", "ProcesoUpdate", 
    "ProcesoResponse",
]
