'use client';

import { AlertCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

interface SessionExpiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: 'inactivity' | 'unauthorized';
}

export function SessionExpiredDialog({
  open,
  onOpenChange,
  reason = 'inactivity',
}: SessionExpiredDialogProps) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleGoToLogin = () => {
    logout();
    onOpenChange(false);
    router.push('/login');
  };

  const title = reason === 'inactivity' 
    ? 'Sesión Expirada por Inactividad' 
    : 'Sesión No Válida';
  
  const description = reason === 'inactivity'
    ? 'Tu sesión ha expirado debido a inactividad. Por favor, inicia sesión nuevamente para continuar.'
    : 'Tu sesión no es válida o ha expirado. Por favor, inicia sesión nuevamente.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-6">
          <p className="text-sm text-muted-foreground">
            Para proteger tu cuenta, se requiere que inicies sesión nuevamente.
          </p>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGoToLogin}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Ir al Login
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
