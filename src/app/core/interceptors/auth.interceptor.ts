import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthLocalService } from '@/auth/services/auth-local.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthLocalService);
  const token = authService.token();

  const language = localStorage.getItem('language');
  const spaceId = localStorage.getItem('space-id');

  if (token) {
    let headers: any = {
      Authorization: `Bearer ${token}`,
      'DeviceType': '3'
    };

    if (spaceId) headers['SpaceId'] = spaceId;
    if (language) headers['Language'] = language;

    const authReq = req.clone({ setHeaders: headers });
    return next(authReq);
  }

  return next(req);
};
