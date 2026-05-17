import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { WebSocketService } from '../../../core/services/websocket.service';
import { buildHttpParams } from '../../../core/utils/http-params.util';
import { ApiResponse, PagedResult } from '../../../core/interfaces/api-response.interface';
import { NotificationPayload } from '../../../core/interfaces/websocket-event.interface';

export interface NotificationFilters {
  page?: number;
  page_size?: number;
  type?: string;
  is_read?: boolean | string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface NotificationStats {
  all: number;
  unread: number;
  read: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly ws = inject(WebSocketService);
  private readonly base = environment.apiUrl;

  readonly notifications = signal<NotificationPayload[]>([]);
  readonly unreadCount = signal<number>(0);
  readonly isLoading = signal(false);
  readonly total = signal(0);
  readonly stats = signal<NotificationStats>({ all: 0, unread: 0, read: 0 });

  constructor() {
    // Listen for new live notifications from WebSocket
    this.ws.notification$.subscribe((notification) => {
      // Prepend to list
      this.notifications.update((list) => [notification, ...list]);
      // Increment unread badge
      this.unreadCount.update((count) => count + 1);
      this.stats.update((s) => ({ ...s, all: s.all + 1, unread: this.unreadCount() }));
    });
  }

  loadNotifications(filters: NotificationFilters = {}): void {
    this.isLoading.set(true);
    const params = buildHttpParams(filters as any);

    this.http.get<ApiResponse<any>>(`${this.base}/api/notifications`, { params }).subscribe({
      next: (res) => {
        this.notifications.set(res.data?.items || []);
        this.total.set(res.data?.total || 0);
        if (res.data?.stats) {
          const s = res.data.stats;
          this.stats.set({
            all: s.all_notifications ?? this.total(),
            unread: s.notifications_unread ?? 0,
            read: s.notifications_read ?? 0,
          });
          this.unreadCount.set(s.notifications_unread ?? 0);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  loadStats(): void {
    this.http.get<ApiResponse<any>>(`${this.base}/api/notifications/unread-count`).subscribe({
      next: (res) => {
        // Handle different possible backend response shapes
        let count = 0;
        if (typeof res.data === 'number') {
          count = res.data;
        } else if (res.data) {
          count = res.data.count ?? res.data.unread_count ?? res.data.unreadCount ?? res.data.unread ?? 0;
        }

        this.unreadCount.set(count);
        this.stats.update((s) => ({ ...s, unread: count, all: s.all || count }));
      }
    });
  }

  markAsRead(id: number | string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.base}/api/notifications/read`, {}, { params: { id: id.toString() } }).pipe(
      tap(() => {
        this.notifications.update(list =>
          list.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
        this.unreadCount.update(c => Math.max(0, c - 1));
        this.stats.update((s) => ({ ...s, unread: this.unreadCount(), read: s.read + 1 }));
      })
    );
  }

  markAllAsRead(): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.base}/api/notifications/read-all`, {}).pipe(
      tap(() => {
        this.notifications.update(list =>
          list.map(n => ({ ...n, is_read: true }))
        );
        this.unreadCount.set(0);
        this.stats.update((s) => ({ ...s, unread: 0, read: s.all }));
      })
    );
  }

  deleteNotification(id: number | string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.base}/api/notifications/${id}`).pipe(
      tap(() => {
        const item = this.notifications().find(n => n.id === id);
        if (item && !item.is_read) {
          this.unreadCount.update(c => Math.max(0, c - 1));
          this.stats.update((s) => ({ ...s, all: Math.max(0, s.all - 1), unread: this.unreadCount() }));
        } else {
          this.stats.update((s) => ({ ...s, all: Math.max(0, s.all - 1), read: Math.max(0, s.read - 1) }));
        }
        this.notifications.update(list => list.filter(n => n.id !== id));
        this.total.update(t => Math.max(0, t - 1));
      })
    );
  }
}
