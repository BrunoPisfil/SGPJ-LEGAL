"use client"

import { useState, useEffect } from "react"
import { Mail, MessageSquare, Bell, Send } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { type EnviarNotificacionRequest } from "@/lib/notificaciones"
import { useAuth } from "@/hooks/use-auth"

interface NotificationDialogProps {
  audienciaId: number
  expediente: string
  onSend: (request: EnviarNotificacionRequest) => Promise<void>
  children: React.ReactNode
}

export function NotificationDialog({
  audienciaId,
  expediente,
  onSend,
  children,
}: NotificationDialogProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [canales, setCanales] = useState<string[]>(['sistema', 'email'])
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [mensajePersonalizado, setMensajePersonalizado] = useState("")

  // Llenar el email del usuario autenticado cuando se abre el diálogo
  useEffect(() => {
    if (user?.email && open) {
      setEmail(user.email)
    }
  }, [user, open])

  const handleChannelChange = (canal: string, checked: boolean) => {
    if (checked) {
      setCanales(prev => [...prev, canal])
    } else {
      setCanales(prev => prev.filter(c => c !== canal))
    }
  }

  const handleSend = async () => {
    if (canales.length === 0) {
      return
    }

    setLoading(true)
    try {
      const request: EnviarNotificacionRequest = {
        audiencia_id: audienciaId,
        canales: canales as ('email' | 'sms' | 'sistema')[],
        ...(email && { email_destinatario: email }),
        ...(telefono && { telefono_destinatario: telefono }),
        ...(mensajePersonalizado && { mensaje_personalizado: mensajePersonalizado }),
      }

      await onSend(request)
      setOpen(false)
      
      // Reset form
      setCanales(['sistema', 'email'])
      setEmail(user?.email || "")
      setTelefono("")
      setMensajePersonalizado("")
      
    } catch (error) {
      console.error('Error sending notification:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar Notificación</DialogTitle>
          <DialogDescription>
            Configura los canales y destinatarios para la notificación de la audiencia del expediente <strong>{expediente}</strong>.
          </DialogDescription>
        </DialogHeader>
        
          <div className="space-y-6 py-4">
          
          {/* Selección de canales */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Canales de notificación</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="sistema"
                  checked={canales.includes('sistema')}
                  onCheckedChange={(checked) => 
                    handleChannelChange('sistema', checked as boolean)
                  }
                />
                <Label htmlFor="sistema" className="flex items-center gap-2 cursor-pointer">
                  <Bell className="h-4 w-4" />
                  Notificación del sistema
                  <Badge variant="outline" className="text-xs">Siempre disponible</Badge>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="email"
                  checked={canales.includes('email')}
                  onCheckedChange={(checked) => 
                    handleChannelChange('email', checked as boolean)
                  }
                />
                <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                  <Mail className="h-4 w-4" />
                  Correo electrónico
                  <Badge variant="outline" className="text-xs bg-blue-50">Email</Badge>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="sms"
                  checked={canales.includes('sms')}
                  onCheckedChange={(checked) => 
                    handleChannelChange('sms', checked as boolean)
                  }
                />
                <Label htmlFor="sms" className="flex items-center gap-2 cursor-pointer">
                  <MessageSquare className="h-4 w-4" />
                  SMS
                  <Badge variant="outline" className="text-xs bg-green-50">Costo adicional</Badge>
                </Label>
              </div>
            </div>
          </div>

          {/* Campos condicionales */}
          {canales.includes('email') && (
            <div className="space-y-2">
              <Label htmlFor="email-input">Email del destinatario *</Label>
              <Input
                id="email-input"
                type="email"
                placeholder="cliente@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          {canales.includes('sms') && (
            <div className="space-y-2">
              <Label htmlFor="telefono-input">Teléfono del destinatario *</Label>
              <Input
                id="telefono-input"
                type="tel"
                placeholder="+51999999999"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Incluye el código de país (ej: +51 para Perú)
              </p>
            </div>
          )}

          {/* Mensaje personalizado */}
          <div className="space-y-2">
            <Label htmlFor="mensaje">Mensaje personalizado (opcional)</Label>
            <Textarea
              id="mensaje"
              placeholder="Información adicional para incluir en la notificación..."
              value={mensajePersonalizado}
              onChange={(e) => setMensajePersonalizado(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={loading || canales.length === 0 || (canales.includes('email') && !email) || (canales.includes('sms') && !telefono)}
          >
            {loading ? (
              <>Enviando...</>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar notificación
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}