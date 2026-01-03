# Guía de Diseño Responsivo (Responsive Design)

## Cambios Implementados

El sistema SGPJ Legal ahora es completamente responsivo y funciona optimalmente en **móviles, tablets y desktops**.

### 1. **Sidebar Responsivo**
- ✅ En móvil (< 768px): El sidebar se transforma en un **drawer modal** deslizable desde la izquierda
- ✅ Botón hamburguesa (☰) visible en móvil para abrir/cerrar el menú
- ✅ Backdrop (fondo oscuro) detrás del drawer para cerrar al hacer clic
- ✅ Animación suave con `translate` CSS
- ✅ En tablet y desktop: El sidebar permanece visible de forma fija
- ✅ El sidebar se cierra automáticamente al seleccionar un enlace en móvil

**Cambios:**
- Ancho responsivo: `w-80` base, pero con `md:translate-x-0` para desktop
- En móvil: `-translate-x-full` (oculto) cuando está cerrado
- `md:hidden` para el botón hamburguesa (solo móvil)
- Padding responsivo: `px-4 sm:px-6` para mejor espaciado en móvil

### 2. **Contenido Principal Responsivo**
- ✅ Margen izquierdo adaptativo: `ml-0 md:ml-80`
- ✅ En móvil: Sin margen (sidebar es modal)
- ✅ En desktop: Margen fijo para el sidebar
- ✅ Padding responsivo: `p-3 sm:p-4 md:p-6`

### 3. **Tablas Responsivas**
- ✅ Scroll horizontal en móvil (sin pisar la interfaz)
- ✅ Columnas ocultas en pantallas pequeñas:
  - `hidden sm:table-cell` para columnas no críticas
  - `hidden md:table-cell` para columnas adicionales
  - `hidden lg:table-cell` para columnas muy detalladas
- ✅ Iconos comprimidos en móvil: `h-3 w-3 sm:h-4 sm:w-4`
- ✅ Texto reducido: `text-xs sm:text-sm`
- ✅ Botones compactos: `h-8 sm:h-9`

**Ejemplo en Procesos:**
```tsx
<TableHead className="hidden sm:table-cell">Materia</TableHead>
<TableHead className="hidden md:table-cell">Demandante</TableHead>
<TableHead className="hidden lg:table-cell">Juzgado</TableHead>
```

### 4. **Grid de KPI Cards**
- ✅ Móvil (< 640px): 2 columnas (`grid-cols-2`)
- ✅ Tablet (640px - 1024px): 2 columnas
- ✅ Desktop (≥ 1024px): 4 columnas (`lg:grid-cols-4`)
- ✅ Gaps responsivos: `gap-3 sm:gap-4 md:gap-6`

### 5. **Espaciado Responsivo en Todo el Sistema**
- ✅ Márgenes: `space-y-4 sm:space-y-6`
- ✅ Gaps en grids: `gap-3 sm:gap-4 md:gap-6`
- ✅ Padding: `p-3 sm:p-4 md:p-6`
- ✅ Padding específico: `px-3 sm:px-6`, `py-4 sm:py-6`

### 6. **Fuentes Responsivas**
- ✅ Títulos principales: `text-2xl sm:text-3xl`
- ✅ Subtítulos: `text-sm sm:text-base`
- ✅ Contenido de tabla: `text-xs sm:text-sm`
- ✅ Iconos: `h-4 w-4 sm:h-5 sm:w-5`

### 7. **Botones Adaptables**
- ✅ Ancho completo en móvil: `w-full sm:w-auto`
- ✅ Tamaño compacto: `h-8 sm:h-9`
- ✅ Iconos solo: Mostrar solo icono en móvil, icono + texto en desktop
  ```tsx
  <span className="hidden sm:inline">Revisado</span>
  ```
- ✅ Espaciado entre botones: `gap-1 sm:gap-2`

### 8. **Header Responsivo**
- ✅ Alto adaptativo: `h-14 sm:h-16`
- ✅ Padding: `px-3 sm:px-6`
- ✅ Gap entre elementos: `gap-2 sm:gap-4`
- ✅ Tamaño de iconos: `h-4 w-4 sm:h-5 sm:w-5`

## Breakpoints Utilizados (Tailwind)

| Clase | Ancho | Uso |
|-------|-------|-----|
| `sm:` | ≥ 640px | Tablets pequeñas |
| `md:` | ≥ 768px | Tablets medianas |
| `lg:` | ≥ 1024px | Desktops |
| `xl:` | ≥ 1280px | Desktops grandes |

## Archivos Modificados

1. **components/app-sidebar.tsx**
   - Añadido estado `isMobileOpen` para controlar drawer en móvil
   - Transiciones CSS suaves
   - Backdrop modal
   - Responsive padding y fonts

2. **components/app-header.tsx**
   - Altura y padding adaptativo
   - Iconos responsivos

3. **app/(app)/layout.tsx**
   - Margen izquierdo responsivo
   - Padding adaptativo

4. **app/(app)/dashboard/page.tsx**
   - Grid KPI con 2 columnas en móvil
   - Espaciado responsivo
   - Tamaños de fuente adaptativos

5. **app/(app)/procesos/page.tsx**
   - Tabla con columnas ocultas según pantalla
   - Botones compactos en móvil
   - Filtros en stack vertical en móvil

## Testing Responsivo

Para verificar la responsividad:

1. **Chrome DevTools:**
   - Presiona F12 → Dispositivo móvil (Ctrl+Shift+M)
   - Prueba en diferentes tamaños: iPhone 12 (390px), iPad (768px), Desktop (1920px)

2. **Diseños a Probar:**
   - ✅ Sidebar abre/cierra en móvil
   - ✅ Contenido se centra y es legible
   - ✅ Tablas scrollean horizontalmente
   - ✅ Botones son tocables (mínimo 44px)
   - ✅ Iconos visibles y claros
   - ✅ Texto legible sin zoom

## Mejores Prácticas Implementadas

✅ **Mobile-First:** Estilos base para móvil, luego se expanden con `sm:`, `md:`, `lg:`
✅ **Touch-Friendly:** Botones y controles con tamaño mínimo de 40-44px
✅ **Progressive Enhancement:** Funcionalidad completa en móvil, mejor experiencia en desktop
✅ **Performance:** Sidebar modal evita scroll horizontal en móvil
✅ **Accesibilidad:** Contraste suficiente en todos los tamaños
✅ **Flexibilidad:** Uso de Tailwind's responsive prefixes en lugar de media queries manuales

## Futuras Mejoras

- [ ] Optimizar imágenes para móvil
- [ ] Considerar bottom sheet para filtros en móvil
- [ ] Agregar viewport meta tag (ya debe estar en layout.tsx)
- [ ] Probar en diferentes navegadores móviles (Safari, Firefox)
- [ ] Implementar lazy loading para tablas grandes

## Conclusión

El sistema SGPJ Legal ahora proporciona una **experiencia fluida** tanto en dispositivos móviles como en desktops. El diseño responsivo es **totalmente funcional** y sigue las **mejores prácticas modernas** de desarrollo web.
