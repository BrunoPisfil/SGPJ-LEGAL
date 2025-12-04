"use client"

import { useState, useEffect } from "react"
import { User, Building2, Bell, Shield, Palette, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ConfiguracionPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Profile settings - Traer datos del usuario autenticado
  const [profileData, setProfileData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    cargo: "",
  })

  // Firm settings - Datos del estudio (pueden venir de una tabla de configuración)
  const [firmData, setFirmData] = useState({
    razonSocial: "",
    ruc: "",
    direccion: "",
    telefono: "",
    email: "",
  })

  // Password change settings
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // 2FA settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  // Cargar datos cuando el usuario esté disponible
  useEffect(() => {
    if (user) {
      setProfileData({
        nombre: user.nombre || "",
        email: user.email || "",
        telefono: user.telefono || "",
        cargo: user.rol || "", // Usar el rol como cargo
      })
      
      // TODO: Aquí podrías cargar los datos del estudio desde una API
      // Por ahora, mantener datos vacíos/placeholder
      setFirmData({
        razonSocial: "",
        ruc: "",
        direccion: "",
        telefono: "",
        email: "",
      })
    }
  }, [user])

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      // Aquí iría una llamada a una API para actualizar el perfil del usuario
      // await userAPI.updateProfile(profileData)
      
      // Por ahora, solo mostrar un toast de éxito (simulado)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Perfil actualizado",
        description: "Tus datos personales han sido actualizados exitosamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveFirm = async () => {
    setIsLoading(true)
    try {
      // Aquí iría una llamada a una API para actualizar los datos del estudio
      // await firmAPI.update(firmData)
      
      // Por ahora, solo mostrar un toast de éxito (simulado)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Datos del estudio actualizados",
        description: "La información del estudio ha sido actualizada exitosamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    setIsLoading(true)
    try {
      // Aquí iría una llamada a una API para guardar las preferencias de notificaciones
      // await notificacionesAPI.updatePreferences(notificationSettings)
      
      // Por ahora, solo mostrar un toast de éxito (simulado)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Preferencias guardadas",
        description: "Tus preferencias de notificaciones han sido actualizadas",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Error de validación",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error de validación",
        description: "Las contraseñas nuevas no coinciden",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Aquí iría una llamada a una API para cambiar la contraseña
      // await authAPI.changePassword(passwordData.currentPassword, passwordData.newPassword)
      
      // Por ahora, solo mostrar un toast de éxito (simulado)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente",
      })
      
      // Limpiar el formulario
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cambiar la contraseña. Verifica tu contraseña actual.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-1">Administra la configuración de tu cuenta y estudio</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList>
          <TabsTrigger value="perfil">
            <User className="mr-2 h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="estudio">
            <Building2 className="mr-2 h-4 w-4" />
            Estudio
          </TabsTrigger>
          <TabsTrigger value="notificaciones">
            <Bell className="mr-2 h-4 w-4" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="seguridad">
            <Shield className="mr-2 h-4 w-4" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="apariencia">
            <Palette className="mr-2 h-4 w-4" />
            Apariencia
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="perfil">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Actualiza tu información personal y de contacto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre Completo</Label>
                  <Input
                    id="nombre"
                    value={profileData.nombre}
                    onChange={(e) => setProfileData({ ...profileData, nombre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={profileData.cargo}
                    onChange={(e) => setProfileData({ ...profileData, cargo: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={profileData.telefono}
                    onChange={(e) => setProfileData({ ...profileData, telefono: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Firm Tab */}
        <TabsContent value="estudio">
          <Card>
            <CardHeader>
              <CardTitle>Información del Estudio</CardTitle>
              <CardDescription>Administra los datos de tu estudio jurídico</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="razonSocial">Razón Social</Label>
                <Input
                  id="razonSocial"
                  value={firmData.razonSocial}
                  onChange={(e) => setFirmData({ ...firmData, razonSocial: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ruc">RUC</Label>
                <Input
                  id="ruc"
                  value={firmData.ruc}
                  onChange={(e) => setFirmData({ ...firmData, ruc: e.target.value })}
                  maxLength={11}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={firmData.direccion}
                  onChange={(e) => setFirmData({ ...firmData, direccion: e.target.value })}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firmTelefono">Teléfono</Label>
                  <Input
                    id="firmTelefono"
                    type="tel"
                    value={firmData.telefono}
                    onChange={(e) => setFirmData({ ...firmData, telefono: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firmEmail">Email</Label>
                  <Input
                    id="firmEmail"
                    type="email"
                    value={firmData.email}
                    onChange={(e) => setFirmData({ ...firmData, email: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveFirm} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notificaciones">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Notificaciones</CardTitle>
              <CardDescription>Configura cómo y cuándo deseas recibir notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Notificaciones por Email</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Audiencias</Label>
                      <p className="text-sm text-muted-foreground">Recibe emails sobre audiencias programadas</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailAudiencias}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, emailAudiencias: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Procesos</Label>
                      <p className="text-sm text-muted-foreground">Recibe emails sobre actualizaciones de procesos</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailProcesos}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, emailProcesos: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Pagos</Label>
                      <p className="text-sm text-muted-foreground">Recibe emails sobre pagos recibidos</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailPagos}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, emailPagos: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Notificaciones Push</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Audiencias</Label>
                      <p className="text-sm text-muted-foreground">Recibe notificaciones push sobre audiencias</p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushAudiencias}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, pushAudiencias: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Procesos</Label>
                      <p className="text-sm text-muted-foreground">Recibe notificaciones push sobre procesos</p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushProcesos}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, pushProcesos: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Pagos</Label>
                      <p className="text-sm text-muted-foreground">Recibe notificaciones push sobre pagos</p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushPagos}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, pushPagos: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Guardando..." : "Guardar Preferencias"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="seguridad">
          <Card>
            <CardHeader>
              <CardTitle>Seguridad</CardTitle>
              <CardDescription>Administra la seguridad de tu cuenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Cambiar Contraseña</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Contraseña Actual</Label>
                    <Input 
                      id="currentPassword" 
                      type="password" 
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input 
                      id="newPassword" 
                      type="password" 
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Autenticación de Dos Factores</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Habilitar 2FA</Label>
                    <p className="text-sm text-muted-foreground">Agrega una capa adicional de seguridad a tu cuenta</p>
                  </div>
                  <Switch 
                    checked={twoFactorEnabled}
                    onCheckedChange={setTwoFactorEnabled}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleChangePassword}
                  disabled={isLoading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Guardando..." : "Cambiar Contraseña"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="apariencia">
          <Card>
            <CardHeader>
              <CardTitle>Apariencia</CardTitle>
              <CardDescription>Personaliza la apariencia de la aplicación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Tema</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="cursor-pointer border-2 border-primary">
                    <CardContent className="p-4 text-center">
                      <div className="rounded-lg bg-background border p-4 mb-2">
                        <div className="h-8 bg-foreground rounded mb-2" />
                        <div className="h-4 bg-muted rounded" />
                      </div>
                      <p className="font-medium">Claro</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer border-2 border-transparent hover:border-muted">
                    <CardContent className="p-4 text-center">
                      <div className="rounded-lg bg-slate-900 border p-4 mb-2">
                        <div className="h-8 bg-slate-100 rounded mb-2" />
                        <div className="h-4 bg-slate-700 rounded" />
                      </div>
                      <p className="font-medium">Oscuro</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer border-2 border-transparent hover:border-muted">
                    <CardContent className="p-4 text-center">
                      <div className="rounded-lg bg-gradient-to-br from-background to-muted border p-4 mb-2">
                        <div className="h-8 bg-foreground rounded mb-2" />
                        <div className="h-4 bg-muted-foreground rounded" />
                      </div>
                      <p className="font-medium">Sistema</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Densidad</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo Compacto</Label>
                    <p className="text-sm text-muted-foreground">Reduce el espaciado para mostrar más información</p>
                  </div>
                  <Switch />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Preferencias
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
