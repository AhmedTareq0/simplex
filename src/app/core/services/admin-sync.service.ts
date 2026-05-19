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
    return forkJoin({
      machines: this.http.post<ApiResponse<any>>(`${this.apiUrl}/api/machines/sync`, {}),
      userMachines: this.http.post<ApiResponse<any>>(`${this.apiUrl}/api/machines/sync-user-machines`, {}),
      tickets: this.http.post<ApiResponse<any>>(`${this.apiUrl}/api/tickets/sync`, {}),
      visits: this.http.post<ApiResponse<any>>(`${this.apiUrl}/api/visits/sync`, {}),
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

  syncModule(module: 'machines' | 'tickets' | 'visits' | 'invoices' | 'machines/sync-user-machines'): Observable<ApiResponse<any>> {
    this.isSyncing.set(true);
    const path = module === 'machines/sync-user-machines' ? 'machines/sync-user-machines' : `${module}/sync`;
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/api/${path}`, {}).pipe(
      tap(() => this.isSyncing.set(false))
    );
  }
}
