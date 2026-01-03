"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Users, Building2, User, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import directorioAPI, { type DirectorioEntry } from "@/lib/directorio"
import { usePermission } from "@/hooks/use-permission"
import Link from "next/link"

export default function DirectorioPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"clientes" | "juzgados" | "especialistas">("clientes")
  const [directorio, setDirectorio] = useState<DirectorioEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { hasPermission } = usePermission()

  // Cargar datos del directorio
  useEffect(() => {
    async function loadDirectorio() {
      try {
        setLoading(true)
        setError(null)
        
        if (searchQuery) {
          // Búsqueda global
          const data = await directorioAPI.search(searchQuery, activeTab)
          setDirectorio(data)
        } else {
          // Cargar por tipo
          let data: DirectorioEntry[] = []
          if (activeTab === "clientes") {
            data = await directorioAPI.getClientes()
          } else if (activeTab === "juzgados") {
            data = await directorioAPI.getJuzgados()
          } else {
            data = await directorioAPI.getEspecialistas()
          }
          setDirectorio(data)
        }
      } catch (err) {
        console.error('Error loading directorio:', err)
        setError('Error al cargar datos del directorio')
      } finally {
        setLoading(false)
      }
    }

    loadDirectorio()
  }, [searchQuery, activeTab])

  // Filtrar por estado activo/inactivo
  const activeEntries = directorio.filter(e => e.activo)
  const inactiveEntries = directorio.filter(e => !e.activo)

  // Componente reutilizable para tarjetas
  const EntryCard = ({ entry }: { entry: DirectorioEntry }) => {
    const getIcon = () => {
      if (entry.tipo === "cliente") {
        return entry.tipo_persona === "natural" ? 
          <User className="h-5 w-5" /> : <Building2 className="h-5 w-5" />
      } else if (entry.tipo === "juzgado") {
        return <Building2 className="h-5 w-5" />
      } else {
        return <Briefcase className="h-5 w-5" />
      }
    }

    const getTitle = () => {
      if (entry.tipo === "cliente") {
        return entry.tipo_persona === "natural" 
          ? `${entry.nombres || ''} ${entry.apellidos || ''}`.trim() 
          : entry.razon_social
      }
      return entry.nombre
    }

    const getSubtitle = () => {
      if (entry.tipo === "cliente") {
        return `${entry.doc_tipo}: ${entry.doc_numero}`
      } else if (entry.tipo === "juzgado") {
        return entry.distrito_judicial || "Juzgado"
      } else {
        return entry.especialidad || "Especialista"
      }
    }

    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                {getIcon()}
              </div>
              <div>
                <h3 className="font-semibold">{getTitle()}</h3>
                <p className="text-sm text-muted-foreground">{getSubtitle()}</p>
              </div>
            </div>
            <Badge variant={entry.activo ? "default" : "secondary"}>
              {entry.activo ? "Activo" : "Inactivo"}
            </Badge>
          </div>

          <div className="space-y-1 text-sm">
            {entry.email && (
              <p className="text-muted-foreground">
                <span className="font-medium">Email:</span> {entry.email}
              </p>
            )}
            {entry.telefono && (
              <p className="text-muted-foreground">
                <span className="font-medium">Teléfono:</span> {entry.telefono}
              </p>
            )}
            {entry.direccion && (
              <p className="text-muted-foreground">
                <span className="font-medium">Dirección:</span> {entry.direccion}
              </p>
            )}
          </div>

          <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
            <Link href={`/directorio/${entry.id}`}>Ver Detalles</Link>
          </Button>
        </div>
      </Card>
    )
  }

  const renderTabContent = () => {
    return (
      <>
        {/* Active Entries */}
        {activeEntries.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Activos</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeEntries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        )}

        {/* Inactive Entries */}
        {inactiveEntries.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Inactivos</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inactiveEntries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && directorio.length === 0 && (
          <Card className="p-8">
            <EmptyState
              icon={Users}
              title={error ? "Error al cargar" : `No hay ${activeTab} registrados`}
              description={error || `Comience creando su primer ${activeTab.slice(0, -1)}`}
              action={{
                label: `Crear nuevo ${activeTab.slice(0, -1)}`,
                onClick: () => (window.location.href = "/directorio/nuevo"),
              }}
            />
          </Card>
        )}
        
        {/* Loading State */}
        {loading && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Cargando...</p>
          </Card>
        )}
      </>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Directorio</h1>
          <p className="text-muted-foreground mt-1">Gestiona clientes, juzgados y especialistas</p>
        </div>
        {hasPermission("directorio", "create") && (
          <Button asChild>
            <Link href="/directorio/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Registro
            </Link>
          </Button>
        )}
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, teléfono o documento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="clientes">
            <Users className="mr-2 h-4 w-4" />
            Clientes ({directorio.filter(e => e.tipo === "cliente").length})
          </TabsTrigger>
          <TabsTrigger value="juzgados">
            <Building2 className="mr-2 h-4 w-4" />
            Juzgados ({directorio.filter(e => e.tipo === "juzgado").length})
          </TabsTrigger>
          <TabsTrigger value="especialistas">
            <Briefcase className="mr-2 h-4 w-4" />
            Especialistas ({directorio.filter(e => e.tipo === "especialista").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 mt-6">
          {renderTabContent()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
