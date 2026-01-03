'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useInactivityTimeout } from '@/hooks/use-inactivity-timeout';

/**
 * Componente que maneja la detección de sesión expirada
 * - Monitorea inactividad del usuario (15 minutos por defecto)
 * - Escucha eventos de No Autenticado (401) del API
 * - Redirige a página de sesión expirada cuando detecta inactividad
 */
export function SessionExpiredHandler() {
  const router = useRouter();
  const { sessionExpired, sessionExpiredReason, isAuthenticated } = useAuth();

  // Configurar timeout de inactividad (15 minutos)
  useInactivityTimeout({
    timeout: 15 * 60 * 1000, // 15 minutos
    events: ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'],
    onTimeout: () => {
      if (isAuthenticated) {
        // Redirigir a página de sesión expirada por inactividad
        console.log('🕐 Timeout de inactividad disparado - redirigiendo');
        router.push('/session-expired?reason=inactivity');
      }
    },
  });

  // Redirigir cuando hay error 401 del API
  useEffect(() => {
    if (sessionExpired) {
      console.log('🔒 Error de autenticación detectado - redirigiendo');
      router.push(`/session-expired?reason=${sessionExpiredReason}`);
    }
  }, [sessionExpired, sessionExpiredReason, router]);

  return null;
}
