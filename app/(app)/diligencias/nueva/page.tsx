"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { diligenciasAPI } from "@/lib/diligencias";
import { procesosAPI } from "@/lib/procesos";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";

interface Proceso {
  id: number;
  expediente: string;
}

export default function NuevaDiligenciaPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    proceso_id: "",
    titulo: "",
    motivo: "",
    fecha: "",
    hora: "",
    descripcion: "",
    notificar: true,
  });

  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [cargandoProcesos, setCargandoProcesos] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar procesos
  useEffect(() => {
    const cargarProcesos = async () => {
      try {
        setCargandoProcesos(true);
        const datos = await procesosAPI.obtenerTodos();
        setProcesos(datos);
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        toast({
          title: "Error",
          description: `No se pudieron cargar los procesos: ${mensaje}`,
          variant: "destructive",
        });
      } finally {
        setCargandoProcesos(false);
      }
    };

    cargarProcesos();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    // Validar campos obligatorios
    if (!formData.proceso_id || !formData.titulo || !formData.motivo || !formData.fecha || !formData.hora) {
      setError("Todos los campos son obligatorios");
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      setCargando(true);
      setError(null);

      const nuevaDiligencia = await diligenciasAPI.crear({
        proceso_id: parseInt(formData.proceso_id),
        titulo: formData.titulo,
        motivo: formData.motivo,
        fecha: formData.fecha,
        hora: formData.hora,
        descripcion: formData.descripcion || undefined,
        notificar: formData.notificar,
      });

      toast({
        title: "Éxito",
        description: "Diligencia creada correctamente",
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
      setCargando(false);
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Nueva Diligencia</h1>
        <p className="text-gray-500 mt-2">Crea una nueva diligencia judicial</p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
        {/* Error general */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 font-medium">Error: {error}</p>
          </div>
        )}

        {/* Proceso */}
        <div className="space-y-2">
          <Label htmlFor="proceso_id">Proceso *</Label>
          <Select
            value={formData.proceso_id}
            onValueChange={(value) => handleSelectChange("proceso_id", value)}
          >
            <SelectTrigger id="proceso_id">
              <SelectValue placeholder="Selecciona un proceso" />
            </SelectTrigger>
            <SelectContent>
              {cargandoProcesos ? (
                <SelectItem disabled value="cargando">
                  Cargando procesos...
                </SelectItem>
              ) : procesos.length === 0 ? (
                <SelectItem disabled value="sin-procesos">
                  No hay procesos disponibles
                </SelectItem>
              ) : (
                procesos.map((proceso) => (
                  <SelectItem key={proceso.id} value={proceso.id.toString()}>
                    {proceso.expediente}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Título */}
        <div className="space-y-2">
          <Label htmlFor="titulo">Título *</Label>
          <Input
            id="titulo"
            name="titulo"
            placeholder="Ej: Presentación de demanda"
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
            placeholder="Descripción breve del motivo de la diligencia"
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

        {/* Descripción */}
        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción adicional</Label>
          <Textarea
            id="descripcion"
            name="descripcion"
            placeholder="Detalles adicionales sobre la diligencia (opcional)"
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

        {/* Botones */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/diligencias")}
            disabled={cargando}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={cargando || cargandoProcesos}>
            {cargando ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Diligencia"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
