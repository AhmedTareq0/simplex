import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthLocalService } from '@/auth/services/auth-local.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthLocalService);
  const router = inject(Router);
  const token = authService.token();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/api/auth/refresh')) {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          return authService.refresh(refreshToken).pipe(
            switchMap((response) => {
              const newToken = response.data.access_token;
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` }
              });
              return next(retryReq);
            }),
            catchError(() => {
              authService.logout();
              router.navigate(['/auth/login']);
              return throwError(() => error);
            })
          );
        }
      }
      return throwError(() => error);
    })
  );
};
