"use client"

import { useState, useEffect } from "react"
import { Bell, Mail, MessageSquare, CheckCircle, Clock, AlertCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/empty-state"
import { formatDate } from "@/lib/format"
import { notificacionesAPI } from "@/lib/notificaciones"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// Función para calcular tiempo restante
const calculateTimeRemaining = (fechaStr: string, horaStr: string) => {
  try {
    // Convertir fecha del formato DD/MM/YYYY a YYYY-MM-DD
    const fechaParts = fechaStr.split('/');
    let fechaISO = fechaStr;
    if (fechaParts.length === 3) {
      // Si está en formato DD/MM/YYYY, convertir a YYYY-MM-DD
      fechaISO = `${fechaParts[2]}-${fechaParts[1].padStart(2, '0')}-${fechaParts[0].padStart(2, '0')}`;
    }
    
    // Crear fecha y hora de la audiencia
    const audienciaDateTime = new Date(`${fechaISO}T${horaStr}:00`);
    const ahora = new Date();
    
    const diferencia = audienciaDateTime.getTime() - ahora.getTime();
    
    if (diferencia <= 0) {
      return { expired: true, text: "Audiencia finalizada", color: "text-red-600" };
    }
    
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    
    if (dias > 0) {
      return { 
        expired: false, 
        text: `${dias}d ${horas}h ${minutos}m`, 
        color: dias <= 1 ? "text-orange-600 font-semibold" : "text-green-600" 
      };
    } else if (horas > 0) {
      return { 
        expired: false, 
        text: `${horas}h ${minutos}m`, 
        color: horas <= 2 ? "text-red-600 font-semibold animate-pulse" : "text-orange-600 font-semibold" 
      };
    } else {
      return { 
        expired: false, 
        text: `${minutos}m`, 
        color: "text-red-600 font-bold animate-pulse" 
      };
    }
  } catch (error) {
    return { expired: false, text: horaStr, color: "text-foreground" };
  }
};

// Componente para mostrar la cuenta regresiva
const CountdownDisplay = ({ fecha, hora }: { fecha: string; hora: string }) => {
  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining(fecha, hora));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(fecha, hora));
    }, 60000); // Actualizar cada minuto
    
    return () => clearInterval(interval);
  }, [fecha, hora]);
  
  return (
    <div className="flex flex-col">
      <span className="font-semibold text-foreground">{hora}</span>
      <span className={`text-xs ${timeRemaining.color}`}>
        {timeRemaining.text}
      </span>
    </div>
  );
};

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [filtroCanal, setFiltroCanal] = useState<string>("todos")
  const { toast } = useToast()

  useEffect(() => {
    loadNotificaciones()
  }, [filtroEstado, filtroCanal])

  const loadNotificaciones = async () => {
    try {
      setIsLoading(true)
      const filters: any = {
        canal: 'sistema' // Solo mostrar notificaciones del sistema (minúsculas)
      }
      
      if (filtroEstado !== "todos") {
        filters.estado = filtroEstado
      }
      
      console.log('🔍 Cargando notificaciones con filtros:', filters)

      const response = await notificacionesAPI.getAll(filters)
      console.log('🔍 Respuesta del API:', response)
      console.log('📋 Notificaciones recibidas:', response.notificaciones)
      console.log('📊 Total:', response.total, 'No leídas:', response.no_leidas)
      setNotificaciones(response.notificaciones)
    } catch (error) {
      console.error('❌ Error loading notifications:', error)
      console.error('❌ Error completo:', JSON.stringify(error, null, 2))
    } finally {
      setIsLoading(false)
    }
  }

  const handleEliminarNotificacion = async (id: number, titulo: string) => {
    try {
      await notificacionesAPI.eliminar(id)
      
      // Remover la notificación del estado local
      setNotificaciones(prev => prev.filter(n => n.id !== id))
      
      toast({
        title: "Notificación eliminada",
        description: `Se ha eliminado "${titulo}" correctamente.`,
      })
    } catch (error) {
      console.error('❌ Error eliminando notificación:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la notificación",
        variant: "destructive",
      })
    }
  }

  const filteredNotificaciones = notificaciones.filter(notif =>
    notif.titulo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notif.mensaje?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusIcon = (estado: string) => {
    switch (estado?.toUpperCase()) {
      case 'ENVIADO':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'PENDIENTE':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getChannelIcon = (canal: string) => {
    switch (canal) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <MessageSquare className="h-4 w-4" />
      case 'sistema':
        return <Bell className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getStatusBadgeVariant = (estado: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (estado?.toUpperCase()) {
      case 'ENVIADO':
        return 'default'
      case 'PENDIENTE':
        return 'secondary'
      case 'ERROR':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const formatMensajeAudiencia = (mensaje: string, metadata_extra?: string, notificacionId?: number, titulo?: string) => {
    try {
      // Intentar obtener información estructurada del metadata
      let metadata = null;
      if (metadata_extra) {
        try {
          metadata = JSON.parse(metadata_extra);
        } catch (e) {
          // Si falla el parse, continúa sin metadata
        }
      }

      // Si el mensaje contiene información de audiencia, mostrar en formato limpio
      if (mensaje.includes('📋') || mensaje.includes('Expediente:') || mensaje.includes('audiencia')) {
        // Extraer información del mensaje
        const expedienteMatch = mensaje.match(/Expediente:\s*([^\n]+)/);
        const fechaMatch = mensaje.match(/Fecha:\s*([^\n]+)/);
        const horaMatch = mensaje.match(/Hora:\s*([^\n]+)/);
        const sedeMatch = mensaje.match(/Sede:\s*([^\n]+)/);
        const tipoMatch = mensaje.match(/Tipo:\s*([^\n]+)/);

        const expediente = expedienteMatch ? expedienteMatch[1].trim() : metadata?.expediente || 'No disponible';
        const fecha = fechaMatch ? fechaMatch[1].trim() : metadata?.fecha_audiencia || 'No disponible';
        const hora = horaMatch ? horaMatch[1].trim() : metadata?.hora_audiencia || 'No disponible';
        const sede = sedeMatch ? sedeMatch[1].trim() : 'No disponible';
        const tipo = tipoMatch ? tipoMatch[1].trim() : metadata?.tipo_audiencia || 'Audiencia';

        return (
          <Card className="border-primary/20 shadow-md bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-primary/10">
              <CardTitle className="text-sm font-medium text-primary">{tipo}</CardTitle>
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/15 p-2 border border-primary/20">
                  <span className="text-primary text-sm font-semibold">⚖</span>
                </div>
                {notificacionId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEliminarNotificacion(notificacionId, titulo || 'Notificación')}
                    className="h-8 w-8 p-0 text-red-600 border-red-200 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-primary/15 shadow-sm">
                  <span className="text-sm font-medium text-muted-foreground">Expediente</span>
                  <span className="font-mono font-semibold text-foreground">{expediente}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-primary/15 shadow-sm">
                    <span className="text-sm font-medium text-muted-foreground">Fecha</span>
                    <span className="font-semibold text-foreground">{fecha}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-primary/15 shadow-sm">
                    <span className="text-sm font-medium text-muted-foreground">Hora</span>
                    <CountdownDisplay fecha={fecha} hora={hora} />
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-primary/15 shadow-sm">
                  <span className="text-sm font-medium text-muted-foreground">Lugar</span>
                  <span className="font-semibold text-foreground">{sede}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }

      // Para otros tipos de notificaciones, formato simple
      return (
        <div className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3 border border-border/50">
          {mensaje}
        </div>
      );
    } catch (error) {
      return <p className="text-sm">{mensaje}</p>;
    }
  };

  const getChannelBadgeColor = (canal: string) => {
    switch (canal) {
      case 'email':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'sms':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'sistema':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notificaciones</h1>
            <p className="text-muted-foreground">Gestiona las notificaciones del sistema</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notificaciones del Sistema</h1>
          <p className="text-muted-foreground">
            Notificaciones internas y recordatorios de audiencias ({filteredNotificaciones.length} total)
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por asunto o expediente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="ENVIADO">Enviado</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
              </SelectContent>
            </Select>
            {/* Canal fijo en SISTEMA - no mostrar selector */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bell className="h-4 w-4" />
              <span>Notificaciones del Sistema</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de notificaciones */}
      {filteredNotificaciones.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No hay notificaciones del sistema"
          description="No se han enviado notificaciones del sistema aún o no hay resultados para los filtros aplicados."
        />
      ) : (
        <div className="grid gap-4">
          {filteredNotificaciones.map((notificacion) => (
            <Card key={notificacion.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(notificacion.estado)}
                      <h3 className="font-semibold">{notificacion.titulo}</h3>
                      <Badge variant={getStatusBadgeVariant(notificacion.estado)}>
                        {notificacion.estado}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {/* Canal siempre es sistema - no necesario mostrar */}
                      {/* Expediente ahora se muestra en el formato estructurado */}
                      <span>{formatDate(notificacion.created_at)}</span>
                    </div>

                    {notificacion.mensaje && (
                      <div className="mt-3">
                        {formatMensajeAudiencia(notificacion.mensaje, notificacion.metadata_extra, notificacion.id, notificacion.titulo)}
                      </div>
                    )}

                    {notificacion.email_destinatario && (
                      <div className="text-xs text-muted-foreground">
                        <span>Enviado a: {notificacion.email_destinatario}</span>
                      </div>
                    )}

                    {notificacion.fecha_enviada && (
                      <div className="text-xs text-muted-foreground">
                        <span>Fecha de envío: {formatDate(notificacion.fecha_enviada)}</span>
                      </div>
                    )}

                    {notificacion.error_mensaje && (
                      <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950 p-2 rounded">
                        <span>Error: {notificacion.error_mensaje}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}