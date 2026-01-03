'use client';

import { useEffect, useRef, useCallback } from 'react';

export interface UseInactivityTimeoutOptions {
  timeout?: number; // tiempo en ms de inactividad antes de trigger (default: 30 minutos)
  events?: string[]; // eventos a escuchar (default: ['mousedown', 'keydown', 'scroll', 'touchstart'])
  onTimeout?: () => void; // callback cuando se alcanza timeout
}

/**
 * Hook que detecta inactividad del usuario y ejecuta un callback
 * Por defecto se activa después de 30 minutos sin actividad
 */
export function useInactivityTimeout({
  timeout = 30 * 60 * 1000, // 30 minutos por defecto
  events = ['mousedown', 'keydown', 'scroll', 'touchstart'],
  onTimeout,
}: UseInactivityTimeoutOptions = {}) {
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimeout = useCallback(() => {
    // Limpiar timeout anterior
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    // Actualizar última actividad
    lastActivityRef.current = Date.now();

    // Configurar nuevo timeout
    timeoutIdRef.current = setTimeout(() => {
      console.log('⏰ Timeout de inactividad alcanzado');
      onTimeout?.();
    }, timeout);
  }, [timeout, onTimeout]);

  useEffect(() => {
    // Inicializar timeout al montar
    resetTimeout();

    // Listener para detectar actividad
    const handleActivity = () => {
      console.log('👆 Actividad detectada - reseteando timer de inactividad');
      resetTimeout();
    };

    // Agregar listeners para cada evento
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimeout, events]);

  // Función para resetear manualmente si es necesario
  const reset = useCallback(() => {
    console.log('🔄 Reseteando timeout manualmente');
    resetTimeout();
  }, [resetTimeout]);

  // Función para obtener el tiempo de inactividad actual
  const getInactivityTime = useCallback(() => {
    return Date.now() - lastActivityRef.current;
  }, []);

  return { reset, getInactivityTime };
}
