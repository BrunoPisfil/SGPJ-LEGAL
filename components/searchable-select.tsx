"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Search, Check, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Option {
  value: string
  label: string
  subtitle?: string
  extra?: string
}

interface SearchableSelectProps {
  placeholder?: string
  emptyMessage?: string
  value?: string
  onValueChange?: (value: string) => void
  onSearch?: (query: string) => Promise<Option[]>
  options?: Option[]
  className?: string
  disabled?: boolean
  clearable?: boolean
}

export function SearchableSelect({
  placeholder = "Seleccionar...",
  emptyMessage = "No se encontraron resultados",
  value,
  onValueChange,
  onSearch,
  options = [],
  className,
  disabled = false,
  clearable = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Option[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Memoize options to prevent unnecessary re-renders
  const memoizedOptions = useMemo(() => options, [JSON.stringify(options)])
  
  const selectedOption = useMemo(() => 
    searchResults.find(opt => opt.value === value) || 
    memoizedOptions.find(opt => opt.value === value),
    [searchResults, memoizedOptions, value]
  )

  // Stable search function
  const performSearch = useCallback(async (query: string) => {
    if (!onSearch) {
      // Static filtering
      if (!query.trim()) {
        setSearchResults(memoizedOptions)
        return
      }
      
      const filtered = memoizedOptions.filter(opt => 
        opt.label.toLowerCase().includes(query.toLowerCase()) ||
        opt.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
        opt.extra?.toLowerCase().includes(query.toLowerCase())
      )
      setSearchResults(filtered)
      return
    }

    // Dynamic search
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    try {
      const results = await onSearch(query)
      setSearchResults(results)
    } catch (error) {
      console.error('Error searching:', error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }, [onSearch, memoizedOptions])

  // Initialize results
  useEffect(() => {
    if (!onSearch) {
      setSearchResults(memoizedOptions)
    }
  }, [onSearch, memoizedOptions])

  // Cargar elementos iniciales cuando se abre el dropdown
  const loadInitialResults = useCallback(async () => {
    if (onSearch && searchResults.length === 0 && !searchQuery.trim() && !isLoading) {
      console.log('🔄 Cargando elementos iniciales...')
      await performSearch('')
    }
  }, [onSearch, searchResults.length, searchQuery, isLoading, performSearch])

  // Handle search query changes with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, performSearch])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (option: Option) => {
    onValueChange?.(option.value)
    setIsOpen(false)
    setSearchQuery("")
  }

  const handleClear = () => {
    onValueChange?.("")
    setSearchQuery("")
  }

  const handleOpen = async () => {
    if (disabled) return
    setIsOpen(true)
    
    // Cargar elementos iniciales si es necesario
    await loadInitialResults()
    
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <div
        onClick={handleOpen}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer",
          "ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50",
          isOpen && "ring-2 ring-ring ring-offset-2"
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedOption ? (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-medium truncate">{selectedOption.label}</span>
              {selectedOption.subtitle && (
                <span className="text-xs text-muted-foreground truncate">{selectedOption.subtitle}</span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {clearable && selectedOption && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg">
          <CardContent className="p-2">
            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Results */}
            <div className="max-h-60 overflow-auto">
              {isLoading ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  Buscando...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  {searchQuery ? emptyMessage : "Escriba para buscar"}
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => handleSelect(option)}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
                        "hover:bg-muted",
                        value === option.value && "bg-muted"
                      )}
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium truncate">{option.label}</span>
                        {option.subtitle && (
                          <span className="text-xs text-muted-foreground truncate">{option.subtitle}</span>
                        )}
                        {option.extra && (
                          <Badge variant="outline" className="text-xs w-fit mt-1">
                            {option.extra}
                          </Badge>
                        )}
                      </div>
                      {value === option.value && <Check className="h-4 w-4" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}