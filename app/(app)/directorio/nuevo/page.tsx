"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import directorioAPI, { type DirectorioCreate } from "@/lib/directorio"
import Link from "next/link"

export default function NuevoDirectorioPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [tipo, setTipo] = useState<"cliente" | "juzgado" | "especialista">("cliente")

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    // Cliente
    tipo_persona: "natural" as "natural" | "juridica",
    nombres: "",
    apellidos: "",
    razon_social: "",
    doc_tipo: "DNI" as "DNI" | "RUC" | "CE" | "PAS",
    doc_numero: "",
    // Juzgado
    distrito_judicial: "",
    // Especialista
    especialidad: "",
    numero_colegiado: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const createData: DirectorioCreate = {
        tipo,
        nombre: formData.nombre,
        email: formData.email || null,
        telefono: formData.telefono || null,
        direccion: formData.direccion || null,
        activo: true,
      }

      // Campos específicos según tipo
      if (tipo === "cliente") {
        createData.tipo_persona = formData.tipo_persona
        createData.nombres = formData.nombres
        createData.apellidos = formData.apellidos
        createData.razon_social = formData.razon_social
        createData.doc_tipo = formData.doc_tipo
        createData.doc_numero = formData.doc_numero
      } else if (tipo === "juzgado") {
        createData.distrito_judicial = formData.distrito_judicial || null
      } else if (tipo === "especialista") {
        createData.nombres = formData.nombres
        createData.apellidos = formData.apellidos
        createData.especialidad = formData.especialidad
        createData.numero_colegiado = formData.numero_colegiado || null
      }

      const result = await directorioAPI.create(createData)

      toast({
        title: "Registro creado",
        description: "El registro ha sido creado exitosamente",
      })
      router.push(`/directorio/${result.id}`)
    } catch (err) {
      console.error("Error creating entry:", err)
      toast({
        title: "Error",
        description: "No se pudo crear el registro",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTipoLabel = () => {
    switch (tipo) {
      case "cliente":
        return "Persona Natural o Jurídica"
      case "juzgado":
        return "Juzgado"
      case "especialista":
        return "Especialista"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/directorio">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Registro</h1>
          <p className="text-muted-foreground mt-1">Crear un nuevo registro en el directorio</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Tipo de Registro</CardTitle>
            <CardDescription>Selecciona el tipo de registro a crear</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={tipo} onValueChange={(value) => {
                setTipo(value as "cliente" | "juzgado" | "especialista")
                setFormData({
                  nombre: "",
                  email: "",
                  telefono: "",
                  direccion: "",
                  tipo_persona: "natural",
                  nombres: "",
                  apellidos: "",
                  razon_social: "",
                  doc_tipo: "DNI",
                  doc_numero: "",
                  distrito_judicial: "",
                  especialidad: "",
                  numero_colegiado: "",
                })
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">Persona Natural o Jurídica</SelectItem>
                  <SelectItem value="juzgado">Juzgado</SelectItem>
                  <SelectItem value="especialista">Especialista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Información de {getTipoLabel()}</CardTitle>
            <CardDescription>Completa los datos del registro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Campos específicos para CLIENTE */}
            {tipo === "cliente" && (
              <>
                <div className="space-y-2">
                  <Label>Tipo de Persona</Label>
                  <Select value={formData.tipo_persona} onValueChange={(value) => setFormData({ ...formData, tipo_persona: value as "natural" | "juridica" })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="natural">Persona Natural</SelectItem>
                      <SelectItem value="juridica">Persona Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.tipo_persona === "natural" ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nombres">Nombres</Label>
                      <Input
                        id="nombres"
                        value={formData.nombres}
                        onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellidos">Apellidos</Label>
                      <Input
                        id="apellidos"
                        placeholder="Pérez García"
                        value={formData.apellidos}
                        onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                        required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="razon_social">Razón Social</Label>
                <Input
                  id="razon_social"
                  value={formData.razon_social}
                  onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="doc_tipo">Tipo de Documento</Label>
                <Select value={formData.doc_tipo} onValueChange={(value) => setFormData({ ...formData, doc_tipo: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DNI">DNI</SelectItem>
                    <SelectItem value="RUC">RUC</SelectItem>
                    <SelectItem value="CE">Carné de Extranjería</SelectItem>
                    <SelectItem value="PAS">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc_numero">Número de Documento</Label>
                <Input
                  id="doc_numero"
                  value={formData.doc_numero}
                  onChange={(e) => setFormData({ ...formData, doc_numero: e.target.value })}
                  required
                />
              </div>
            </div>
            </>
            )}

            {/* Campos específicos para JUZGADO */}
            {tipo === "juzgado" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Juzgado</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="distrito_judicial">Distrito Judicial</Label>
                  <Input
                    id="distrito_judicial"
                    value={formData.distrito_judicial}
                    onChange={(e) => setFormData({ ...formData, distrito_judicial: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Campos específicos para ESPECIALISTA */}
            {tipo === "especialista" && (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nombres">Nombres</Label>
                    <Input
                      id="nombres"
                      value={formData.nombres}
                      onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellidos">Apellidos</Label>
                    <Input
                      id="apellidos"
                      value={formData.apellidos}
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="especialidad">Especialidad</Label>
                    <Input
                      id="especialidad"
                      value={formData.especialidad}
                      onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero_colegiado">Número Colegiado</Label>
                    <Input
                      id="numero_colegiado"
                      value={formData.numero_colegiado}
                      onChange={(e) => setFormData({ ...formData, numero_colegiado: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Contacto */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
            </div>

            {/* Dirección */}
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/directorio")}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Registro"}
          </Button>
        </div>
      </form>
    </div>
  )
}
