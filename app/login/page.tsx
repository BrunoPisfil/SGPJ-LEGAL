"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Scale } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { authAPI } from "@/lib/auth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Por favor ingrese email y contraseña",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await authAPI.login({ email, password })
      
      toast({
        title: "¡Bienvenido!",
        description: `Sesión iniciada como ${response.user.nombre}`,
      })
      
      // Usar location.href en lugar de router.push para forzar un refresh
      // Esto asegura que el contexto esté completamente sincronizado
      await new Promise(resolve => setTimeout(resolve, 500))
      const redirectPath = response.user.rol === 'practicante' ? '/procesos' : '/dashboard'
      window.location.href = redirectPath
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Credenciales incorrectas",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md border-border/50 shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center p-2">
            <img 
              src="/logo.jpg" 
              alt="SGPJ Logo" 
              className="w-full h-full object-contain rounded-lg"
              onError={(e) => {
                // Fallback al ícono de balanza si no se encuentra la imagen
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.parentElement?.querySelector('.fallback-icon');
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
            <Scale className="h-8 w-8 text-primary hidden fallback-icon" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-center leading-tight">Pisfil Leon Abogados & Asociados</CardTitle>
            <CardDescription className="text-base mt-2">Sistema de Gestión de Procesos Judiciales</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Ingresando..." : "Ingresar"}
            </Button>
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                onClick={() => {
                  toast({
                    title: "Recuperación de contraseña",
                    description: "Contacte al administrador del sistema",
                  })
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
