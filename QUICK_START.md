# 🚀 GUÍA DE INICIO RÁPIDO - SGPJ Legal

## ⚡ 5 Minutos para Empezar

### 1️⃣ **Instalar Dependencias**

```bash
# Frontend
pnpm install

# Backend (en otra terminal)
cd backend
pip install -r requirements.txt
```

### 2️⃣ **Inicia el Servidor**

```bash
# Terminal 1: Frontend (desde raíz del proyecto)
pnpm dev

# Terminal 2: Backend (desde carpeta backend)
python main.py
```

### 3️⃣ **Abre en el Navegador**

```
Frontend: http://localhost:3000
Backend API: http://localhost:8000
```

### 4️⃣ **Prueba la Responsividad**

```
1. Presiona F12 (DevTools)
2. Presiona Ctrl+Shift+M (Device Emulation)
3. ¡Disfruta viendo cómo se adapta!
```

---

## 🎯 QUÉ PROBAR PRIMERO

### En Móvil (390px - iPhone 12)
- [ ] Dashboard carga correctamente
- [ ] Sidebar hamburguesa (☰) visible
- [ ] Haz clic en ☰ → sidebar se abre
- [ ] Haz clic en "Procesos" → se cierra automáticamente
- [ ] Ver tabla de procesos sin scroll horizontal forzado

### En Tablet (768px - iPad)
- [ ] Sidebar sigue siendo modal
- [ ] Dashboard muestra 2 columnas de KPI
- [ ] Tabla comienza a mostrar más columnas

### En Desktop (1920px)
- [ ] Sidebar permanece fijo a la izquierda
- [ ] Dashboard muestra 4 columnas de KPI
- [ ] Todas las columnas de la tabla visibles
- [ ] Sin botón hamburguesa

---

## 📁 ESTRUCTURA DEL PROYECTO

```
sgpj-legal/
├── app/                      # Frontend Next.js
│   ├── (app)/               # Aplicación principal
│   │   ├── dashboard/       # Dashboard
│   │   ├── procesos/        # Gestión de procesos
│   │   ├── audiencias/      # Audiencias
│   │   ├── resoluciones/    # Resoluciones
│   │   └── directorio/      # Directorio
│   ├── login/               # Página de login
│   └── layout.tsx           # Layout principal
├── components/              # Componentes React
│   ├── app-sidebar.tsx      # ✅ Responsive
│   ├── app-header.tsx       # ✅ Responsive
│   ├── dashboard/           # Componentes dashboard
│   └── ui/                  # Componentes shadcn/ui
├── backend/                 # Backend FastAPI
│   ├── app/                 # Código de la aplicación
│   ├── main.py              # Servidor principal
│   └── requirements.txt      # Dependencias
├── docs/                    # Documentación
├── RESPONSIVENESS.md        # 📱 Guía responsividad
├── TESTING_RESPONSIVENESS.md # 🧪 Cómo probar
└── README.md                # ℹ️ Información general
```

---

## 🔐 LOGIN CREDENCIALES

### Usuario Administrador
```
Email: admin@example.com
Password: admin123
```

### Usuario Practicante
```
Email: practicante@example.com
Password: practicante123
```

---

## 🌐 ENDPOINTS PRINCIPALES

### Frontend
```
http://localhost:3000/dashboard      # Dashboard
http://localhost:3000/procesos       # Gestión de procesos
http://localhost:3000/audiencias     # Audiencias
http://localhost:3000/resoluciones   # Resoluciones
http://localhost:3000/directorio     # Directorio
http://localhost:3000/finanzas       # Finanzas
```

### Backend API
```
http://localhost:8000/api/v1/procesos           # API Procesos
http://localhost:8000/api/v1/audiencias         # API Audiencias
http://localhost:8000/api/v1/resoluciones      # API Resoluciones
http://localhost:8000/api/v1/directorio        # API Directorio
http://localhost:8000/docs                     # Swagger Docs
```

---

## 🧪 TESTING RESPONSIVITY

### Opción 1: Chrome DevTools (Recomendado)
```
1. Abre DevTools: F12
2. Presiona: Ctrl+Shift+M
3. Elige dispositivo de dropdown
4. ¡Prueba!
```

### Opción 2: Firefox
```
1. Abre DevTools: Ctrl+Shift+M
2. Selecciona dispositivo
3. ¡Prueba!
```

### Opción 3: Dispositivo Real
```
1. En la misma red WiFi
2. Obtén IP de tu computadora: ipconfig (Windows) o ifconfig (Mac/Linux)
3. En móvil: http://[TU_IP]:3000
4. ¡Prueba!
```

---

## 📊 BREAKPOINTS

```
Mobile:   < 640px   (sm:)
Tablet:   640-1024px (md:, lg:)
Desktop:  > 1024px  (lg:, xl:)
```

---

## ⚙️ CONFIGURACIÓN

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)
```
DATABASE_URL=mysql://root:password@localhost/sgpj_legal
JWT_SECRET=your-secret-key
CORS_ORIGINS=http://localhost:3000
```

---

## 🐛 TROUBLESHOOTING

### El sidebar no se ve en móvil
```
✓ Verifica que estés en modo Device Emulation (Ctrl+Shift+M)
✓ Actualiza la página (Ctrl+R o Cmd+R)
✓ Abre DevTools console (F12 → Console) para buscar errores
```

### La tabla no scrollea
```
✓ Verifica el ancho de la pantalla (<640px para móvil)
✓ Asegúrate de que overflow-x-auto está presente
✓ Redimensiona la tabla manualmente
```

### Botones no funcionan
```
✓ Abre Console (F12) y verifica errores
✓ Asegúrate de que el backend está corriendo
✓ Verifica las credenciales de la base de datos
```

### Fuentes se ven extrañas
```
✓ Limpia el cache: Ctrl+Shift+Delete
✓ Actualiza: Ctrl+Shift+R (hard refresh)
✓ Verifica que Next.js se compiló correctamente
```

---

## 📚 DOCUMENTACIÓN COMPLETA

### Responsividad
- 📱 [RESPONSIVENESS.md](./RESPONSIVENESS.md) - Guía técnica
- 📱 [TESTING_RESPONSIVENESS.md](./TESTING_RESPONSIVENESS.md) - Cómo probar
- 📱 [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) - Resumen

### Permisos (Implementado en sesión anterior)
- 🔐 [PERMISSIONS_IMPLEMENTATION.md](./PERMISSIONS_IMPLEMENTATION.md) - Permisos por rol

### General
- 📘 [README.md](./README.md) - Información general
- 🏗️ [INTEGRATION.md](./backend/INTEGRATION.md) - Integración frontend-backend

---

## 🎯 CASOS DE USO

### Como Usuario Administrador
1. Abre dashboard → Ves todos los KPIs
2. Crea nuevo proceso → Aparece en la lista
3. Asigna roles → Practicante ve solo sus procesos

### Como Usuario Practicante
1. Abre dashboard → Solo ve sus procesos
2. No puede crear procesos → "Nuevo Proceso" deshabilitado
3. Puede crear audiencias → Botón "Nueva Audiencia" visible

### En Móvil
1. Abre en iPhone → Sidebar es drawer
2. Haz clic en ☰ → Menú se abre
3. Toca "Procesos" → Va a procesos, cierra sidebar
4. Scrollea tabla → Sin overflow horizontal

---

## 🔗 LINKS ÚTILES

- **Tailwind CSS**: https://tailwindcss.com/
- **Next.js**: https://nextjs.org/
- **FastAPI**: https://fastapi.tiangolo.com/
- **Shadcn/UI**: https://ui.shadcn.com/
- **Lucide Icons**: https://lucide.dev/

---

## 💡 TIPS

### Desarrollo Rápido
```bash
# Rebuild next app si hay cambios de estilos
rm -rf .next && pnpm build

# Limpiar caché
pnpm cache clean --all

# Ver logs del servidor
pnpm dev --verbose
```

### Debugging
```
1. Abre DevTools (F12)
2. Console tab → Busca errores
3. Network tab → Verifica peticiones a API
4. Application tab → Revisa localStorage
```

### Performance
```
1. DevTools → Lighthouse
2. Corre análisis
3. Implementa sugerencias
```

---

## 🎉 ¡LISTO PARA USAR!

Ahora tienes SGPJ Legal completamente funcional y responsivo.

**¡Que disfrutes! 🏛️**

---

## 📞 SOPORTE

Si encuentras problemas:

1. Verifica los logs de la consola (F12)
2. Revisa la documentación en `/docs`
3. Comprueba que el backend está corriendo
4. Asegúrate de que MySQL está conectado

---

*Última actualización: 2024 | SGPJ Legal*
