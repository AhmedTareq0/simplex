import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { WebSocketService } from '../../core/services/websocket.service';

export interface AuthCredentials {
  PhoneNumber?: string;
  email?: string;
  password?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_at: string;
    user: any;
  };
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_at: string;
    user?: any;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthLocalService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly ws = inject(WebSocketService);

  private readonly _token = signal<string | null>(localStorage.getItem('access_token'));
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());

  login(credentials: AuthCredentials): Observable<LoginResponse> {
    const endpoint = `${environment.apiUrl}/api/auth/employee/login`;
    return this.http.post<LoginResponse>(endpoint, credentials).pipe(
      tap((response) => {
        const token = response?.data?.access_token;
        const refreshToken = response?.data?.refresh_token;
        if (token) {
          localStorage.setItem('access_token', token);
          if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
          }
          localStorage.setItem('user', JSON.stringify(response.data.user));
          this._token.set(token);
          this.ws.connect(token);
        }
      })
    );
  }

  refresh(refreshToken: string): Observable<RefreshResponse> {
    const endpoint = `${environment.apiUrl}/api/auth/refresh`;
    return this.http.post<RefreshResponse>(endpoint, { refreshToken }).pipe(
      tap((response) => {
        const token = response?.data?.access_token;
        const newRefreshToken = response?.data?.refresh_token;
        if (token) {
          localStorage.setItem('access_token', token);
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }
          this._token.set(token);
        }
      }),
      catchError((error) => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  logout() {
    const endpoint = `${environment.apiUrl}/api/auth/logout`;
    this.http.post(endpoint, {}).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  private clearSession() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this._token.set(null);
    this.router.navigate(['/auth/login']);
  }
}
