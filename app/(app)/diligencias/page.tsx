"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Diligencia, diligenciasAPI, EstadoDiligencia } from "@/lib/diligencias";
import { useToast } from "@/hooks/use-toast";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Trash2, Edit2, AlertCircle } from "lucide-react";

const ESTADO_COLORS: Record<EstadoDiligencia, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  EN_PROGRESO: "bg-blue-100 text-blue-800",
  COMPLETADA: "bg-green-100 text-green-800",
  CANCELADA: "bg-red-100 text-red-800",
};

const ESTADO_LABELS: Record<EstadoDiligencia, string> = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En Progreso",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
};

export default function DiligenciasPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [diligencias, setDiligencias] = useState<Diligencia[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<EstadoDiligencia | "todas">(
    "todas"
  );
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Cargar diligencias
  useEffect(() => {
    const cargarDiligencias = async () => {
      try {
        setCargando(true);
        setError(null);
        const datos = await diligenciasAPI.obtenerTodas();
        setDiligencias(datos);
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        setError(mensaje);
        toast({
          title: "Error",
          description: mensaje,
          variant: "destructive",
        });
      } finally {
        setCargando(false);
      }
    };

    cargarDiligencias();
  }, [toast]);

  // Filtrar diligencias
  const diligenciasFiltradas = diligencias.filter((d) => {
    const coincideBusqueda =
      d.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      d.motivo.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado === "todas" || d.estado === filtroEstado;
    return coincideBusqueda && coincideEstado;
  });

  // Eliminar diligencia
  const handleEliminar = async (id: number) => {
    try {
      await diligenciasAPI.eliminar(id);
      setDiligencias(diligencias.filter((d) => d.id !== id));
      setDeleteConfirmId(null);
      toast({
        title: "Éxito",
        description: "Diligencia eliminada correctamente",
      });
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : "Error desconocido";
      toast({
        title: "Error",
        description: mensaje,
        variant: "destructive",
      });
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Cargando diligencias...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Diligencias</h1>
          <p className="text-gray-500 mt-2">Gestiona tus diligencias judiciales</p>
        </div>
        <Button
          onClick={() => router.push("/diligencias/nueva")}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Diligencia
        </Button>
      </div>

      {/* Controles de filtro */}
      <div className="flex gap-4 flex-col md:flex-row">
        <Input
          placeholder="Buscar por título o motivo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1"
        />
        <Select value={filtroEstado} onValueChange={(value) => setFiltroEstado(value as EstadoDiligencia | "todas")}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos los estados</SelectItem>
            <SelectItem value="PENDIENTE">Pendiente</SelectItem>
            <SelectItem value="EN_PROGRESO">En Progreso</SelectItem>
            <SelectItem value="COMPLETADA">Completada</SelectItem>
            <SelectItem value="CANCELADA">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Tabla */}
      {diligenciasFiltradas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No se encontraron diligencias</p>
          <p className="text-gray-400 text-sm">
            {busqueda || filtroEstado !== "todas"
              ? "Intenta cambiar los filtros de búsqueda"
              : "Crea una nueva diligencia para comenzar"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Título</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Notificación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {diligenciasFiltradas.map((diligencia) => (
                <TableRow key={diligencia.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{diligencia.titulo}</TableCell>
                  <TableCell>
                    {format(parse(diligencia.fecha as string, "yyyy-MM-dd", new Date()), "dd/MM/yyyy", {
                      locale: es,
                    })}
                  </TableCell>
                  <TableCell>{diligencia.hora}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {diligencia.motivo}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        ESTADO_COLORS[diligencia.estado]
                      }`}
                    >
                      {ESTADO_LABELS[diligencia.estado]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {diligencia.notificacion_enviada ? (
                        <span className="text-green-600">✓ Enviada</span>
                      ) : diligencia.notificar ? (
                        <span className="text-blue-600">Pendiente</span>
                      ) : (
                        <span className="text-gray-500">Deshabilitada</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/diligencias/${diligencia.id}/editar`)
                        }
                        className="w-10 h-10 p-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirmId(diligencia.id)}
                        className="w-10 h-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        title="Eliminar Diligencia"
        description="¿Está seguro de que desea eliminar esta diligencia? Esta acción no se puede deshacer."
        onConfirm={() => deleteConfirmId !== null && handleEliminar(deleteConfirmId)}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
}
