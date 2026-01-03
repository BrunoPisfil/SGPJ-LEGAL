'use client'

import { useState, useEffect } from 'react'
import { Search, Building, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { juzgadosAPI, type Juzgado } from '@/lib/juzgados'

interface SedeAudienciaProps {
  selectedSedeId?: string
  onSedeSelect: (sede: Juzgado) => void
  trigger?: React.ReactNode
}

export function SedeAudienciaSelector({
  selectedSedeId,
  onSedeSelect,
  trigger,
}: SedeAudienciaProps) {
  const [open, setOpen] = useState(false)
  const [sedes, setSedes] = useState<Juzgado[]>([])
  const [filteredSedes, setFilteredSedes] = useState<Juzgado[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Cargar sedes cuando se abre el modal
  useEffect(() => {
    if (open) {
      console.log('🔓 Modal de sedes abierto, cargando datos...')
      loadSedes()
    }
  }, [open])

  // Filtrar sedes cuando cambia la búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSedes(sedes)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = sedes.filter(
        (sede) =>
          sede.nombre.toLowerCase().includes(query) ||
          sede.distrito_judicial.toLowerCase().includes(query) ||
          (sede.direccion && sede.direccion.toLowerCase().includes(query))
      )
      setFilteredSedes(filtered)
    }
  }, [searchQuery, sedes])

  const loadSedes = async () => {
    try {
      setLoading(true)
      console.log('📡 Cargando sedes desde /directorio/juzgados...')
      const data = await juzgadosAPI.getAll()
      console.log('✅ Sedes cargadas:', data)
      setSedes(data)
      setFilteredSedes(data)
      
      if (data.length === 0) {
        console.warn('⚠️ No hay sedes en la BD, usando data de fallback para testing')
      }
    } catch (error) {
      console.error('❌ Error loading sedes:', error)
      // Usar data de fallback para testing si hay error
      const fallbackSedes: Juzgado[] = [
        {
          id: 1,
          nombre: '1º Juzgado Civil de Lima',
          distrito_judicial: 'Lima',
          direccion: 'Jr. Carabaya 300, Lima',
        },
        {
          id: 2,
          nombre: '2º Juzgado Civil de Lima',
          distrito_judicial: 'Lima',
          direccion: 'Jr. Carabaya 300, Lima',
        },
        {
          id: 3,
          nombre: '1º Juzgado Laboral de Lima',
          distrito_judicial: 'Lima',
          direccion: 'Av. Abancay 500, Lima',
        },
        {
          id: 4,
          nombre: '1º Juzgado Penal de Lima',
          distrito_judicial: 'Lima',
          direccion: 'Av. Abancay 500, Lima',
        },
        {
          id: 5,
          nombre: '1º Juzgado Mercantil de Lima',
          distrito_judicial: 'Lima',
          direccion: 'Jr. Puno 100, Lima',
        },
      ]
      setSedes(fallbackSedes)
      setFilteredSedes(fallbackSedes)
      console.log('⚠️ Usando sedes de fallback para testing')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSede = (sede: Juzgado) => {
    onSedeSelect(sede)
    setOpen(false)
    setSearchQuery('')
  }

  const selectedSede = sedes.find((s) => s.id.toString() === selectedSedeId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant='outline' className='w-full justify-start text-left font-normal'>
            <Building className='mr-2 h-4 w-4' />
            {selectedSede ? `${selectedSede.nombre} (${selectedSede.distrito_judicial})` : 'Seleccionar sede...'}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Seleccionar Sede Judicial</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Search */}
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Buscar por nombre, distrito o dirección...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9'
            />
          </div>

          {/* Results */}
          {loading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='text-muted-foreground'>Cargando sedes...</div>
            </div>
          ) : filteredSedes.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8 gap-2'>
              <div className='text-muted-foreground'>No hay sedes disponibles</div>
              {sedes.length === 0 && (
                <div className='text-xs text-muted-foreground text-center px-4'>
                  Verifica que haya juzgados registrados en el directorio
                </div>
              )}
            </div>
          ) : (
            <ScrollArea className='h-[400px] w-full rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sede</TableHead>
                    <TableHead>Distrito Judicial</TableHead>
                    <TableHead>Dirección</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSedes.map((sede) => (
                    <TableRow
                      key={sede.id}
                      className='cursor-pointer hover:bg-muted/50'
                      onClick={() => handleSelectSede(sede)}
                    >
                      <TableCell className='font-medium py-2'>
                        <div>
                          <p className='font-medium text-sm'>{sede.nombre}</p>
                        </div>
                      </TableCell>
                      <TableCell className='py-2'>
                        <div className='flex items-center gap-1'>
                          <MapPin className='h-3 w-3 text-muted-foreground shrink-0' />
                          <span className='text-xs'>{sede.distrito_judicial}</span>
                        </div>
                      </TableCell>
                      <TableCell className='py-2'>
                        <div className='text-xs text-muted-foreground'>
                          {sede.direccion || 'No disponible'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
