import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, map } from 'rxjs';
import { ApiResponse, PagedResult } from '../../../core/interfaces/api-response.interface';

// ─── Interfaces ───────────────────────────────────────────────

export type NotificationType =
  | 'new_escalation'
  | 'ticket_update'
  | 'visit_scheduled'
  | 'visit_completed'
  | 'engineer_assigned'
  | 'message_received'
  | 'system_alert'
  | 'visit_cancelled';

export type NotificationChannel = 'push' | 'websocket' | 'email' | 'sms';
export type NotificationStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  recipient_id: number;
  recipient_name: string;
  recipient_role: string;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  page?: number;
  page_size?: number;
  type?: NotificationType | '';
  status?: NotificationStatus | '';
  channel?: NotificationChannel | '';
  search?: string;
  from?: string;
  to?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  delivered: number;
  failed: number;
  today_count: number;
}

// ─── Mock Data ────────────────────────────────────────────────

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'ntf_001',
    title: 'محادثة جديدة تم تصعيدها',
    body: 'العميل أحمد محمد طلب التحدث مع خدمة العملاء بخصوص عطل في الطابعة X200.',
    type: 'new_escalation',
    channel: 'websocket',
    status: 'read',
    recipient_id: 5,
    recipient_name: 'سارة حسن',
    recipient_role: 'customer_care',
    reference_id: 'conv_abc123',
    reference_type: 'conversation',
    created_at: '2026-05-11T14:30:00Z',
    delivered_at: '2026-05-11T14:30:01Z',
    read_at: '2026-05-11T14:32:00Z',
    metadata: { customer_name: 'أحمد محمد', machine_name: 'Printer X200' }
  },
  {
    id: 'ntf_002',
    title: 'تحديث حالة تذكرة',
    body: 'التذكرة #1042 تم تغيير حالتها إلى "قيد التنفيذ" بواسطة المهندس خالد سمير.',
    type: 'ticket_update',
    channel: 'push',
    status: 'delivered',
    recipient_id: 5,
    recipient_name: 'سارة حسن',
    recipient_role: 'customer_care',
    reference_id: '1042',
    reference_type: 'ticket',
    created_at: '2026-05-11T13:15:00Z',
    delivered_at: '2026-05-11T13:15:02Z',
    read_at: null,
    metadata: { ticket_id: 1042, new_status: 'in_progress', engineer: 'خالد سمير' }
  },
  {
    id: 'ntf_003',
    title: 'زيارة مجدولة',
    body: 'تم جدولة زيارة صيانة FSM/2026/045 للعميل محمود علي يوم 15 مايو 2026 الساعة 10:00 ص.',
    type: 'visit_scheduled',
    channel: 'push',
    status: 'delivered',
    recipient_id: 8,
    recipient_name: 'خالد سمير',
    recipient_role: 'engineer',
    reference_id: '202',
    reference_type: 'visit',
    created_at: '2026-05-11T11:00:00Z',
    delivered_at: '2026-05-11T11:00:03Z',
    read_at: null,
    metadata: { visit_name: 'FSM/2026/045', customer: 'محمود علي', date: '2026-05-15T10:00:00Z' }
  },
  {
    id: 'ntf_004',
    title: 'زيارة مكتملة',
    body: 'المهندس خالد سمير أكمل الزيارة FSM/2026/038 بنجاح.',
    type: 'visit_completed',
    channel: 'websocket',
    status: 'read',
    recipient_id: 1,
    recipient_name: 'أحمد المدير',
    recipient_role: 'superadmin',
    reference_id: '195',
    reference_type: 'visit',
    created_at: '2026-05-11T09:45:00Z',
    delivered_at: '2026-05-11T09:45:01Z',
    read_at: '2026-05-11T10:00:00Z',
    metadata: { visit_name: 'FSM/2026/038', engineer: 'خالد سمير' }
  },
  {
    id: 'ntf_005',
    title: 'تعيين مهندس',
    body: 'تم تعيين المهندس يوسف أحمد للمحادثة مع العميل فاطمة حسين.',
    type: 'engineer_assigned',
    channel: 'push',
    status: 'sent',
    recipient_id: 12,
    recipient_name: 'يوسف أحمد',
    recipient_role: 'engineer',
    reference_id: 'conv_def456',
    reference_type: 'conversation',
    created_at: '2026-05-11T08:20:00Z',
    delivered_at: null,
    read_at: null,
    metadata: { customer_name: 'فاطمة حسين', machine_name: 'CNC Machine A1' }
  },
  {
    id: 'ntf_006',
    title: 'رسالة جديدة',
    body: 'رسالة جديدة من العميل محمد حسن: "الماكينة لا تعمل بعد الصيانة"',
    type: 'message_received',
    channel: 'websocket',
    status: 'delivered',
    recipient_id: 5,
    recipient_name: 'سارة حسن',
    recipient_role: 'customer_care',
    reference_id: 'conv_ghi789',
    reference_type: 'conversation',
    created_at: '2026-05-10T16:45:00Z',
    delivered_at: '2026-05-10T16:45:01Z',
    read_at: null,
    metadata: { customer_name: 'محمد حسن' }
  },
  {
    id: 'ntf_007',
    title: 'تنبيه النظام',
    body: 'يوجد 5 تذاكر عالية الأولوية لم يتم الرد عليها خلال 24 ساعة.',
    type: 'system_alert',
    channel: 'email',
    status: 'delivered',
    recipient_id: 1,
    recipient_name: 'أحمد المدير',
    recipient_role: 'superadmin',
    reference_id: undefined,
    reference_type: undefined,
    created_at: '2026-05-10T08:00:00Z',
    delivered_at: '2026-05-10T08:00:05Z',
    read_at: null,
    metadata: { high_priority_count: 5 }
  },
  {
    id: 'ntf_008',
    title: 'إلغاء زيارة',
    body: 'تم إلغاء الزيارة FSM/2026/041 بسبب طلب العميل.',
    type: 'visit_cancelled',
    channel: 'push',
    status: 'read',
    recipient_id: 8,
    recipient_name: 'خالد سمير',
    recipient_role: 'engineer',
    reference_id: '198',
    reference_type: 'visit',
    created_at: '2026-05-10T07:30:00Z',
    delivered_at: '2026-05-10T07:30:02Z',
    read_at: '2026-05-10T07:35:00Z',
    metadata: { visit_name: 'FSM/2026/041', reason: 'طلب العميل' }
  },
  {
    id: 'ntf_009',
    title: 'محادثة جديدة تم تصعيدها',
    body: 'العميلة نورا خالد طلبت التحدث مع خدمة العملاء بخصوص مشكلة في ماكينة القص.',
    type: 'new_escalation',
    channel: 'websocket',
    status: 'delivered',
    recipient_id: 5,
    recipient_name: 'سارة حسن',
    recipient_role: 'customer_care',
    reference_id: 'conv_jkl012',
    reference_type: 'conversation',
    created_at: '2026-05-09T15:20:00Z',
    delivered_at: '2026-05-09T15:20:01Z',
    read_at: null,
    metadata: { customer_name: 'نورا خالد', machine_name: 'Cutting Machine B3' }
  },
  {
    id: 'ntf_010',
    title: 'تحديث حالة تذكرة',
    body: 'التذكرة #1038 تم حلها وإغلاقها تلقائيًا بعد إنهاء المحادثة.',
    type: 'ticket_update',
    channel: 'push',
    status: 'failed',
    recipient_id: 5,
    recipient_name: 'سارة حسن',
    recipient_role: 'customer_care',
    reference_id: '1038',
    reference_type: 'ticket',
    created_at: '2026-05-09T12:00:00Z',
    delivered_at: null,
    read_at: null,
    metadata: { ticket_id: 1038, new_status: 'solved', error: 'Push token expired' }
  },
  {
    id: 'ntf_011',
    title: 'رسالة جديدة',
    body: 'رسالة جديدة من المهندس يوسف أحمد: "تم فحص الماكينة وتحتاج قطعة غيار"',
    type: 'message_received',
    channel: 'websocket',
    status: 'read',
    recipient_id: 5,
    recipient_name: 'سارة حسن',
    recipient_role: 'customer_care',
    reference_id: 'conv_mno345',
    reference_type: 'conversation',
    created_at: '2026-05-09T10:30:00Z',
    delivered_at: '2026-05-09T10:30:01Z',
    read_at: '2026-05-09T10:31:00Z',
    metadata: { sender_name: 'يوسف أحمد', sender_role: 'engineer' }
  },
  {
    id: 'ntf_012',
    title: 'زيارة مجدولة',
    body: 'تم جدولة زيارة صيانة طارئة FSM/2026/050 للعميل شركة الفا يوم 12 مايو 2026.',
    type: 'visit_scheduled',
    channel: 'email',
    status: 'delivered',
    recipient_id: 12,
    recipient_name: 'يوسف أحمد',
    recipient_role: 'engineer',
    reference_id: '210',
    reference_type: 'visit',
    created_at: '2026-05-08T16:00:00Z',
    delivered_at: '2026-05-08T16:00:10Z',
    read_at: null,
    metadata: { visit_name: 'FSM/2026/050', customer: 'شركة الفا', urgent: true }
  },
  {
    id: 'ntf_013',
    title: 'تنبيه النظام',
    body: 'تم مزامنة 15 ماكينة جديدة من نظام Odoo بنجاح.',
    type: 'system_alert',
    channel: 'websocket',
    status: 'read',
    recipient_id: 1,
    recipient_name: 'أحمد المدير',
    recipient_role: 'superadmin',
    reference_id: undefined,
    reference_type: undefined,
    created_at: '2026-05-08T09:00:00Z',
    delivered_at: '2026-05-08T09:00:01Z',
    read_at: '2026-05-08T09:05:00Z',
    metadata: { synced_count: 15 }
  },
  {
    id: 'ntf_014',
    title: 'تعيين مهندس',
    body: 'تم تعيين المهندس خالد سمير للمحادثة مع العميل عمر أحمد بخصوص ماكينة الطباعة.',
    type: 'engineer_assigned',
    channel: 'push',
    status: 'delivered',
    recipient_id: 8,
    recipient_name: 'خالد سمير',
    recipient_role: 'engineer',
    reference_id: 'conv_pqr678',
    reference_type: 'conversation',
    created_at: '2026-05-07T14:15:00Z',
    delivered_at: '2026-05-07T14:15:03Z',
    read_at: null,
    metadata: { customer_name: 'عمر أحمد', machine_name: 'Printer Z500' }
  },
  {
    id: 'ntf_015',
    title: 'زيارة مكتملة',
    body: 'المهندس يوسف أحمد أكمل الزيارة FSM/2026/032 بنجاح. تقييم العميل: 5/5.',
    type: 'visit_completed',
    channel: 'push',
    status: 'delivered',
    recipient_id: 1,
    recipient_name: 'أحمد المدير',
    recipient_role: 'superadmin',
    reference_id: '188',
    reference_type: 'visit',
    created_at: '2026-05-07T11:00:00Z',
    delivered_at: '2026-05-07T11:00:02Z',
    read_at: null,
    metadata: { visit_name: 'FSM/2026/032', engineer: 'يوسف أحمد', rating: 5 }
  },
];

// ─── Service ──────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  readonly notifications = signal<AppNotification[]>([]);
  readonly isLoading = signal(false);
  readonly total = signal(0);
  readonly stats = signal<NotificationStats>({
    total: 0,
    unread: 0,
    delivered: 0,
    failed: 0,
    today_count: 0,
  });


  loadNotifications(filters: NotificationFilters = {}): void {
    this.isLoading.set(true);

    this._fetchMock(filters)
      .subscribe({
        next: (res) => {
          this.notifications.set(res.data?.items || []);
          this.total.set(res.data?.total || 0);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  /** Load KPI stats (mock). */
  loadStats(): void {
    const today = new Date().toISOString().split('T')[0];
    const todayCount = MOCK_NOTIFICATIONS.filter(n => n.created_at.startsWith(today)).length;

    this.stats.set({
      total: MOCK_NOTIFICATIONS.length,
      unread: MOCK_NOTIFICATIONS.filter(n => n.status !== 'read').length,
      delivered: MOCK_NOTIFICATIONS.filter(n => n.status === 'delivered').length,
      failed: MOCK_NOTIFICATIONS.filter(n => n.status === 'failed').length,
      today_count: todayCount || 3, // fallback for demo
    });
  }

  /** Mark a notification as read (mock). */
  markAsRead(id: string): Observable<ApiResponse<AppNotification>> {
    const item = MOCK_NOTIFICATIONS.find(n => n.id === id);
    if (item) {
      item.status = 'read';
      item.read_at = new Date().toISOString();
    }
    this.notifications.update(list =>
      list.map(n => n.id === id ? { ...n, status: 'read' as NotificationStatus, read_at: new Date().toISOString() } : n)
    );
    this.loadStats();
    return of({ success: true, message: 'تم القراءة', data: item!, status: 200 }).pipe(delay(300));
  }

  /** Mark all as read (mock). */
  markAllAsRead(): Observable<ApiResponse<null>> {
    MOCK_NOTIFICATIONS.forEach(n => {
      if (n.status !== 'read' && n.status !== 'failed') {
        n.status = 'read';
        n.read_at = new Date().toISOString();
      }
    });
    this.notifications.update(list =>
      list.map(n => n.status !== 'failed' ? { ...n, status: 'read' as NotificationStatus, read_at: new Date().toISOString() } : n)
    );
    this.loadStats();
    return of({ success: true, message: 'تم قراءة الكل', data: null, status: 200 }).pipe(delay(300));
  }

  /** Delete a notification (mock). */
  deleteNotification(id: string): Observable<ApiResponse<null>> {
    const idx = MOCK_NOTIFICATIONS.findIndex(n => n.id === id);
    if (idx > -1) MOCK_NOTIFICATIONS.splice(idx, 1);
    this.notifications.update(list => list.filter(n => n.id !== id));
    this.total.update(t => t - 1);
    this.loadStats();
    return of({ success: true, message: 'تم الحذف', data: null, status: 200 }).pipe(delay(300));
  }

  // ─── Private Mock Fetcher ─────────────────────────────────

  private _fetchMock(filters: NotificationFilters): Observable<ApiResponse<PagedResult<AppNotification>>> {
    const page = filters.page || 1;
    const pageSize = filters.page_size || 10;

    let filtered = [...MOCK_NOTIFICATIONS];

    // Filter by type
    if (filters.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(n => n.status === filters.status);
    }

    // Filter by channel
    if (filters.channel) {
      filtered = filtered.filter(n => n.channel === filters.channel);
    }

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.recipient_name.toLowerCase().includes(q)
      );
    }

    // Date range
    if (filters.from) {
      filtered = filtered.filter(n => n.created_at >= filters.from!);
    }
    if (filters.to) {
      filtered = filtered.filter(n => n.created_at <= filters.to!);
    }

    // Sort by date desc
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    const result: ApiResponse<PagedResult<AppNotification>> = {
      success: true,
      message: '',
      status: 200,
      data: { items, total, page, page_size: pageSize, total_pages: Math.ceil(total / pageSize) },
    };

    return of(result).pipe(delay(600));
  }
}
