import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthLocalService } from '@/auth/services/auth-local.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthLocalService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthLocalService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
