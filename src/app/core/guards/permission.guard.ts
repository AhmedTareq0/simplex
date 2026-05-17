import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthLocalService } from '@/auth/services/auth-local.service';
import { Permission } from '@/auth/roles';

export const permissionGuard: CanActivateFn = (route) => {
  const authService = inject(AuthLocalService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/auth/login']);
  }

  const requiredPermission = route.data?.['permission'] as Permission;

  if (!requiredPermission || authService.hasPermission(requiredPermission)) {
    return true;
  }

  return router.createUrlTree(['/tickets']);
};
