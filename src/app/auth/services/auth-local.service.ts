import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap, delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AuthCredentials {
  PhoneNumber?: string;
  email?: string;
  password?: string;
}

interface LoginResponse {
  data: {
    accessToken: string;
    user?: any;
  };
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthLocalService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);


  private readonly _token = signal<string | null>(localStorage.getItem('token'));
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());

  login(credentials: AuthCredentials): Observable<LoginResponse> {
    // === REAL API CALL (COMMENTED OUT) ===
    // const endpoint = `${environment.apiUrl}/Authentication/Login`;
    // return this.http.post<LoginResponse>(endpoint, credentials).pipe( ... );

    // === MOCK LOGIN SUCCESS ===
    const mockResponse: LoginResponse = {
      data: {
        accessToken: 'mock-token-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    };

    return of(mockResponse).pipe(
      delay(1500), // Simulate network delay
      tap((response) => {
        const token = response?.data?.accessToken;
        if (token) {
          localStorage.setItem('token', token);
          this._token.set(token);
        }
      })
    );
  }


  logout() {
    localStorage.removeItem('token');
    this._token.set(null);
    this.router.navigate(['/auth/login']);
  }
}
