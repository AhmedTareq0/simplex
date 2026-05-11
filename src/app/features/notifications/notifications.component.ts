import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  SharedTableComponent,
  TableColumn,
  ButtonComponent,
  SkeletonLoaderComponent,
  IconComponent,
  SharedModalComponent,
  AppIconName,
} from '../../shared/components';
import {
  NotificationsService,
  AppNotification,
  NotificationType,
  NotificationStatus,
  NotificationChannel,
  NotificationFilters,
} from './services/notifications.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SharedTableComponent,
    SkeletonLoaderComponent,
    ButtonComponent,
    IconComponent,
    SharedModalComponent,
  ],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent implements OnInit {
  readonly notifService = inject(NotificationsService);
  private readonly route = inject(ActivatedRoute);

  selectedNotification = signal<AppNotification | null>(null);
  showDetailModal = signal(false);
  currentPage = signal(1);
  pageSize = signal(10);
  isMarkingAll = signal(false);

  // Filters
  filterType = signal<NotificationType | ''>('');
  filterStatus = signal<NotificationStatus | ''>('');
  filterChannel = signal<NotificationChannel | ''>('');
  showFilters = signal(false);

  get isLoading(): boolean { return this.notifService.isLoading(); }
  get total(): number { return this.notifService.total(); }
  get notifications(): AppNotification[] { return this.notifService.notifications(); }
  get stats() { return this.notifService.stats(); }

  columns: TableColumn[] = [
    {
      field: 'type',
      header: 'النوع',
      type: 'badge',
      formatter: (value: string) => this.getTypeLabel(value),
    },
    {
      field: 'title',
      header: 'العنوان',
      type: 'text',
      filterable: true,
    },
    {
      field: 'recipient_name',
      header: 'المستلم',
      type: 'text',
    },
    {
      field: 'channel',
      header: 'القناة',
      type: 'badge',
      formatter: (value: string) => this.getChannelLabel(value),
    },
    {
      field: 'status',
      header: 'الحالة',
      type: 'badge',
      formatter: (value: string) => this.getStatusLabel(value),
    },
    {
      field: 'created_at',
      header: 'التاريخ',
      type: 'text',
      formatter: (value: string) => this.formatDate(value),
    },
  ];

  readonly typeOptions = [
    { label: 'الكل', value: '' },
    { label: 'محادثة مصعّدة', value: 'new_escalation' },
    { label: 'تحديث تذكرة', value: 'ticket_update' },
    { label: 'زيارة مجدولة', value: 'visit_scheduled' },
    { label: 'زيارة مكتملة', value: 'visit_completed' },
    { label: 'تعيين مهندس', value: 'engineer_assigned' },
    { label: 'رسالة جديدة', value: 'message_received' },
    { label: 'تنبيه النظام', value: 'system_alert' },
    { label: 'إلغاء زيارة', value: 'visit_cancelled' },
  ];

  readonly statusOptions = [
    { label: 'الكل', value: '' },
    { label: 'مرسل', value: 'sent' },
    { label: 'تم التسليم', value: 'delivered' },
    { label: 'مقروء', value: 'read' },
    { label: 'فشل', value: 'failed' },
  ];

  readonly channelOptions = [
    { label: 'الكل', value: '' },
    { label: 'Push', value: 'push' },
    { label: 'WebSocket', value: 'websocket' },
    { label: 'بريد إلكتروني', value: 'email' },
    { label: 'SMS', value: 'sms' },
  ];

  ngOnInit() {
    this.notifService.loadStats();
    this.loadData();

    // Check for ID in query params to open detail modal
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (id) {
        // Wait for data to load then find and open
        setTimeout(() => {
          const notif = this.notifications.find(n => n.id === id);
          if (notif) {
            this.onRowClick(notif);
          }
        }, 800); // Wait for mock delay
      }
    });
  }

  loadData() {
    this.notifService.loadNotifications(this.buildFilters());
  }

  private buildFilters(): NotificationFilters {
    return {
      page: this.currentPage(),
      page_size: this.pageSize(),
      type: this.filterType(),
      status: this.filterStatus(),
      channel: this.filterChannel(),
    };
  }

  onPageChange(event: { page: number; rows: number }) {
    this.currentPage.set(event.page);
    this.pageSize.set(event.rows);
    this.loadData();
  }

  onRowClick(notification: AppNotification) {
    this.selectedNotification.set(notification);
    this.showDetailModal.set(true);

    // Auto-mark as read when opened
    if (notification.status !== 'read' && notification.status !== 'failed') {
      this.notifService.markAsRead(notification.id).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.selectedNotification.set(res.data);
          }
        }
      });
    }
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadData();
  }

  resetFilters() {
    this.filterType.set('');
    this.filterStatus.set('');
    this.filterChannel.set('');
    this.currentPage.set(1);
    this.loadData();
  }

  toggleFilters() {
    this.showFilters.update(v => !v);
  }

  markAllRead() {
    this.isMarkingAll.set(true);
    this.notifService.markAllAsRead().subscribe({
      next: () => {
        this.isMarkingAll.set(false);
        this.loadData();
      },
      error: () => this.isMarkingAll.set(false),
    });
  }

  deleteNotification(id: string) {
    this.notifService.deleteNotification(id).subscribe({
      next: () => {
        this.showDetailModal.set(false);
        this.selectedNotification.set(null);
      },
    });
  }

  // ─── Formatting Helpers ─────────────────────────────────────

  getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      new_escalation: 'تصعيد',
      ticket_update: 'تذكرة',
      visit_scheduled: 'جدولة',
      visit_completed: 'اكتمال',
      engineer_assigned: 'تعيين',
      message_received: 'رسالة',
      system_alert: 'تنبيه',
      visit_cancelled: 'إلغاء',
    };
    return map[type] || type;
  }

  getTypeIcon(type: string): AppIconName {
    const map: Record<string, AppIconName> = {
      new_escalation: 'messageSquare',
      ticket_update: 'calendarClock',
      visit_scheduled: 'mapMarker',
      visit_completed: 'check',
      engineer_assigned: 'users',
      message_received: 'chat',
      system_alert: 'bell',
      visit_cancelled: 'xCircle',
    };
    return map[type] || 'bell';
  }

  getTypeColor(type: string): string {
    const map: Record<string, string> = {
      new_escalation: '#8b5cf6',
      ticket_update: '#3b82f6',
      visit_scheduled: '#059669',
      visit_completed: '#10b981',
      engineer_assigned: '#6366f1',
      message_received: '#0ea5e9',
      system_alert: '#f59e0b',
      visit_cancelled: '#ef4444',
    };
    return map[type] || '#6b7280';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      sent: 'مرسل',
      delivered: 'تم التسليم',
      read: 'مقروء',
      failed: 'فشل',
    };
    return map[status] || status;
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      sent: '#f59e0b',
      delivered: '#3b82f6',
      read: '#10b981',
      failed: '#ef4444',
    };
    return map[status] || '#6b7280';
  }

  getChannelLabel(channel: string): string {
    const map: Record<string, string> = {
      push: 'Push',
      websocket: 'WebSocket',
      email: 'بريد إلكتروني',
      sms: 'SMS',
    };
    return map[channel] || channel;
  }

  getChannelIcon(channel: string): AppIconName {
    const map: Record<string, AppIconName> = {
      push: 'bell',
      websocket: 'zap',
      email: 'mail',
      sms: 'phone',
    };
    return map[channel] || 'bell';
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatRelativeTime(date: string): string {
    const now = new Date().getTime();
    const then = new Date(date).getTime();
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return this.formatDate(date);
  }
}
