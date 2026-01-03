"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ProcessSelector } from "@/components/process-selector"
import { type Proceso } from "@/lib/procesos"
import { cn } from "@/lib/utils"

interface CompactProcessSelectorProps {
  selectedProcessId?: string
  onProcessSelect: (proceso: Proceso) => void
  placeholder?: string
  className?: string
  variant?: "compact" | "modal"
}

export function CompactProcessSelector({ 
  selectedProcessId, 
  onProcessSelect, 
  placeholder = "Seleccionar proceso...",
  className,
  variant = "compact"
}: CompactProcessSelectorProps) {
  const [open, setOpen] = useState(false)
  
  // Si es variante modal, usar el ProcessSelector completo
  if (variant === "modal") {
    return (
      <ProcessSelector
        selectedProcessId={selectedProcessId}
        onProcessSelect={onProcessSelect}
      />
    )
  }
  
  // Versión compacta con Command
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {selectedProcessId ? (
              <span className="truncate">Proceso seleccionado</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="w-full justify-center"
          >
            Usar búsqueda avanzada
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}