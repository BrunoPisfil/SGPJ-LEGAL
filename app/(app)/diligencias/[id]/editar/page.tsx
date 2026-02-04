"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { diligenciasAPI, Diligencia, EstadoDiligencia } from "@/lib/diligencias";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

export default function EditarDiligenciaPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const diligenciaId = parseInt(params.id as string);

  const [diligencia, setDiligencia] = useState<Diligencia | null>(null);
  const [formData, setFormData] = useState({
    titulo: "",
    motivo: "",
    fecha: "",
    hora: "",
    descripcion: "",
    estado: "pendiente" as EstadoDiligencia,
    notificar: true,
  });

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar diligencia
  useEffect(() => {
    const cargarDiligencia = async () => {
      try {
        setCargando(true);
        setError(null);
        const datos = await diligenciasAPI.obtener(diligenciaId);
        setDiligencia(datos);
        setFormData({
          titulo: datos.titulo,
          motivo: datos.motivo,
          fecha: datos.fecha,
          hora: datos.hora,
          descripcion: datos.descripcion || "",
          estado: datos.estado,
          notificar: datos.notificar,
        });
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

    cargarDiligencia();
  }, [diligenciaId, toast]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      notificar: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo || !formData.motivo || !formData.fecha || !formData.hora) {
      setError("Todos los campos son obligatorios");
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      setGuardando(true);
      setError(null);

      await diligenciasAPI.actualizar(diligenciaId, {
        titulo: formData.titulo,
        motivo: formData.motivo,
        fecha: formData.fecha,
        hora: formData.hora,
        descripcion: formData.descripcion || undefined,
        estado: formData.estado,
        notificar: formData.notificar,
      });

      toast({
        title: "Éxito",
        description: "Diligencia actualizada correctamente",
      });

      router.push("/diligencias");
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : "Error desconocido";
      setError(mensaje);
      toast({
        title: "Error",
        description: mensaje,
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Cargando diligencia...</p>
      </div>
    );
  }

  if (!diligencia) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-gray-500">No se pudo cargar la diligencia</p>
        <Link href="/diligencias">
          <Button variant="outline">Volver a Diligencias</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/diligencias"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Diligencias
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Editar Diligencia</h1>
        <p className="text-gray-500 mt-2">Actualiza los detalles de la diligencia</p>
      </div>

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-lg border border-gray-200"
      >
        {/* Error general */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 font-medium">Error: {error}</p>
          </div>
        )}

        {/* Título */}
        <div className="space-y-2">
          <Label htmlFor="titulo">Título *</Label>
          <Input
            id="titulo"
            name="titulo"
            value={formData.titulo}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Motivo */}
        <div className="space-y-2">
          <Label htmlFor="motivo">Motivo *</Label>
          <Textarea
            id="motivo"
            name="motivo"
            value={formData.motivo}
            onChange={handleInputChange}
            required
            rows={3}
          />
        </div>

        {/* Fecha y Hora */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha *</Label>
            <Input
              id="fecha"
              name="fecha"
              type="date"
              value={formData.fecha}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hora">Hora *</Label>
            <Input
              id="hora"
              name="hora"
              type="time"
              value={formData.hora}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        {/* Estado */}
        <div className="space-y-2">
          <Label htmlFor="estado">Estado *</Label>
          <Select value={formData.estado} onValueChange={(value) => handleSelectChange("estado", value)}>
            <SelectTrigger id="estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="en_progreso">En Progreso</SelectItem>
              <SelectItem value="completada">Completada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción adicional</Label>
          <Textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleInputChange}
            rows={3}
          />
        </div>

        {/* Notificar */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <Checkbox
            id="notificar"
            checked={formData.notificar}
            onCheckedChange={handleCheckChange}
          />
          <Label htmlFor="notificar" className="cursor-pointer flex-1 mb-0">
            Enviar notificación automática 24 horas antes
            <p className="text-sm text-gray-500 mt-1">
              Se enviará una notificación automática por email y en el sistema
            </p>
          </Label>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            <strong>Creada:</strong>{" "}
            {new Date(diligencia.created_at).toLocaleString("es-ES")}
          </p>
          <p className="text-sm text-blue-700 mt-1">
            <strong>Última actualización:</strong>{" "}
            {new Date(diligencia.updated_at).toLocaleString("es-ES")}
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/diligencias")}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={guardando}>
            {guardando ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
