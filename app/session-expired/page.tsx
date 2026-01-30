'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface SessionExpiredPageProps {
  searchParams: {
    reason?: 'inactivity' | 'unauthorized';
  };
}

export default function SessionExpiredPage({
  searchParams,
}: SessionExpiredPageProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const reason = (searchParams.reason || 'unauthorized') as 'inactivity' | 'unauthorized';

  const isInactivity = reason === 'inactivity';
  const title = isInactivity 
    ? 'Sesión Expirada por Inactividad' 
    : 'Sesión No Válida';
  
  const description = isInactivity
    ? 'Tu sesión ha expirado debido a que no has realizado ninguna acción durante 1 hora.'
    : 'Tu sesión no es válida o ha expirado. Por favor, inicia sesión nuevamente para continuar.';

  const handleGoToLogin = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg border border-border p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-4">
              <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center mb-2 text-foreground">
            {title}
          </h1>

          {/* Description */}
          <p className="text-center text-muted-foreground mb-2">
            {description}
          </p>

          {/* Extra info */}
          <p className="text-center text-sm text-muted-foreground mb-8">
            Para proteger tu cuenta, se requiere que inicies sesión nuevamente.
          </p>

          {/* Details */}
          <div className="bg-muted/50 rounded-lg p-4 mb-8 border border-border">
            <h3 className="font-semibold text-foreground mb-3">¿Qué pasó?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {isInactivity ? (
                <>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Detectamos 1 hora de inactividad</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Tu sesión fue cerrada automáticamente</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Tus datos están seguros</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Tu token de autenticación expiró</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Necesitas iniciar sesión nuevamente</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Tus datos están seguros</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Button */}
          <Button
            onClick={handleGoToLogin}
            className="w-full h-11 gap-2 bg-primary hover:bg-primary/90"
            size="lg"
          >
            <LogOut className="h-4 w-4" />
            Volver al Login
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          ¿Problemas? Contacta con soporte si continúas teniendo dificultades.
        </p>
      </div>
    </div>
  );
}
