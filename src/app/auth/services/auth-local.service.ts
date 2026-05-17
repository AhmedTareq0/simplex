import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { WebSocketService } from '../../core/services/websocket.service';
import { AppRole, Permission, ROLE_PERMISSIONS } from '../roles';

export interface AuthCredentials {
  email?: string;
  password?: string;
}

export interface CurrentUser {
  id: string | number;
  name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  department: string | null;
  employee_role: string;
  user_type: string;
  created_at: string;
  last_login: string;
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

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthLocalService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly ws = inject(WebSocketService);

  private readonly _token = signal<string | null>(localStorage.getItem('access_token'));
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());

  // Role Helpers
  readonly userType = computed(() => this.currentUser()?.user_type);
  readonly employeeRole = computed(() => this.currentUser()?.employee_role);

  readonly isSuperAdmin = computed(() => this.employeeRole() === 'superadmin' || this.userType() === 'superadmin');
  readonly isCustomerSupport = computed(() => this.employeeRole() === 'customer_support');
  readonly isEngineer = computed(() => this.employeeRole() === 'engineer');

  readonly role = computed<AppRole | null>(() => {
    if (this.isSuperAdmin()) return 'superadmin';
    if (this.isCustomerSupport()) return 'customer_support';
    if (this.isEngineer()) return 'engineer';
    return null;
  });

  readonly permissions = computed<Permission[]>(() => {
    const currentRole = this.role();
    return currentRole ? ROLE_PERMISSIONS[currentRole] : [];
  });

  hasPermission(permission: Permission): boolean {
    return this.permissions().includes(permission);
  }

  readonly currentUser = signal<CurrentUser | null>(this.loadCachedUser());

  private loadCachedUser(): CurrentUser | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  login(credentials: AuthCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/api/auth/employee/login`, credentials).pipe(
      tap((response) => {
        const token = response?.data?.access_token;
        const refreshToken = response?.data?.refresh_token;
        if (token) {
          localStorage.setItem('access_token', token);
          if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
          const user = response.data.user;
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUser.set(user);
          this._token.set(token);
          this.ws.connect(token);
        }
      })
    );
  }

  // Fetch fresh user data from API and update signal + cache
  fetchCurrentUser(): void {
    this.http.get<{ success: boolean; data: CurrentUser }>(`${environment.apiUrl}/api/auth/me`)
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            localStorage.setItem('user', JSON.stringify(res.data));
            this.currentUser.set(res.data);
          }
        },
        error: () => {

        },
      });
  }

  refresh(refreshToken: string): Observable<RefreshResponse> {
    return this.http.post<RefreshResponse>(`${environment.apiUrl}/api/auth/refresh`, { refresh_token: refreshToken }).pipe(
      tap((response) => {
        const token = response?.data?.access_token;
        const newRefreshToken = response?.data?.refresh_token;
        if (token) {
          localStorage.setItem('access_token', token);
          if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken);
          this._token.set(token);
          // Refresh user data after token refresh
          this.fetchCurrentUser();
        }
      }),
      catchError((error) => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /** Change password — revokes all sessions on success, user must re-login */
  changePassword(payload: ChangePasswordRequest): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/auth/change-password`, payload).pipe(
      tap(() => {
        // All sessions are revoked by the server, clear local state
        this.clearSession();
      })
    );
  }

  logout() {
    this.http.post(`${environment.apiUrl}/api/auth/logout`, {}).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  private clearSession() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this._token.set(null);
    this.currentUser.set(null);
    this.ws.disconnect();
    this.router.navigate(['/auth/login']);
  }
}
