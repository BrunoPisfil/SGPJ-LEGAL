# Importar todos los modelos aquí para que SQLAlchemy los registre
from backend.app.models.usuario import Usuario
from backend.app.models.juzgado import Juzgado  
from backend.app.models.cliente import Cliente
from backend.app.models.entidad import Entidad
from backend.app.models.abogado import Abogado
from backend.app.models.especialista import Especialista
from backend.app.models.proceso import Proceso
from backend.app.models.audiencia import Audiencia
from backend.app.models.contrato import Contrato
from backend.app.models.bitacora_proceso import BitacoraProceso
from backend.app.models.resolucion import Resolucion
from backend.app.models.notificacion import Notificacion
from backend.app.models.pago import Pago
from backend.app.models.parte_proceso import ParteProceso
from backend.app.models.directorio import Directorio

__all__ = [
    "Usuario",
    "Juzgado", 
    "Cliente",
    "Entidad",
    "Abogado",
    "Especialista",
    "Proceso",
    "Audiencia",
    "Contrato",
    "Notificacion",
    "Resolucion",
    "Pago",
    "ParteProceso",
    "BitacoraProceso",
    "Directorio",
]
