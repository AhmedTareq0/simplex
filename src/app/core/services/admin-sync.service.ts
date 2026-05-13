import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable({ providedIn: 'root' })
export class AdminSyncService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly isSyncing = signal(false);
  readonly lastSyncStatus = signal<string | null>(null);

  syncAll(): Observable<any> {
    this.isSyncing.set(true);
    // Triggering multiple sync endpoints in parallel
    return forkJoin({
      machines: this.http.post<ApiResponse<any>>(`${this.apiUrl}/api/machines/sync`, {}),
      tickets: this.http.post<ApiResponse<any>>(`${this.apiUrl}/api/tickets/sync`, {}),
      visits: this.http.post<ApiResponse<any>>(`${this.apiUrl}/api/visits/sync`, {}),
      users: this.http.post<ApiResponse<any>>(`${this.apiUrl}/api/users/sync`, {})
    }).pipe(
      tap({
        next: () => {
          this.isSyncing.set(false);
          this.lastSyncStatus.set('نجحت مزامنة جميع البيانات من Odoo بنجاح');
        },
        error: () => {
          this.isSyncing.set(false);
          this.lastSyncStatus.set('حدث خطأ أثناء المزامنة، يرجى المحاولة لاحقاً');
        }
      })
    );
  }

  syncModule(module: 'machines' | 'tickets' | 'visits' | 'users'): Observable<ApiResponse<any>> {
    this.isSyncing.set(true);
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/api/${module}/sync`, {}).pipe(
      tap(() => this.isSyncing.set(false))
    );
  }
}
