# Importar todos los modelos aquí para que SQLAlchemy los registre
from app.models.usuario import Usuario
from app.models.juzgado import Juzgado  
from app.models.cliente import Cliente
from app.models.entidad import Entidad
from app.models.abogado import Abogado
from app.models.especialista import Especialista
from app.models.proceso import Proceso
from app.models.audiencia import Audiencia
from app.models.contrato import Contrato
from app.models.bitacora_proceso import BitacoraProceso
from app.models.bitacora_resolucion import BitacoraResolucion
from app.models.resolucion import Resolucion
from app.models.notificacion import Notificacion
from app.models.pago import Pago
from app.models.parte_proceso import ParteProceso
from app.models.directorio import Directorio

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
    "BitacoraResolucion",
    "Directorio",
]
