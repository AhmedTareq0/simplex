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
  SharedInputComponent,
  SharedSelectComponent,
} from '../../shared/components';
import {
  NotificationsService,
  NotificationFilters,
} from './services/notifications.service';
import { NotificationPayload } from '../../core/interfaces/websocket-event.interface';

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
    SharedInputComponent,
    SharedSelectComponent,
  ],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent implements OnInit {
  readonly notifService = inject(NotificationsService);
  private readonly route = inject(ActivatedRoute);

  selectedNotification = signal<NotificationPayload | null>(null);
  showDetailModal = signal(false);
  currentPage = signal(1);
  pageSize = signal(10);
  isMarkingAll = signal(false);

  // Filters
  filterType = signal<string>('');
  filterIsRead = signal<boolean | ''>('');
  filterSearch = signal<string>('');
  showFilters = signal(false);

  get isLoading(): boolean { return this.notifService.isLoading(); }
  get total(): number { return this.notifService.total(); }
  get notifications(): NotificationPayload[] { return this.notifService.notifications(); }
  get stats() { return this.notifService.stats(); }

  columns: TableColumn[] = [
    {
      field: 'type',
      header: 'النوع',
      type: 'badge',
      formatter: (value: string) => this.getTypeLabel(value),
      filterable: true,
    },
    {
      field: 'title',
      header: 'العنوان',
      type: 'text',
    },
    {
      field: 'is_read',
      header: 'الحالة',
      type: 'badge',
      formatter: (value: boolean) => value ? 'مقروء' : 'غير مقروء',
      filterable: true,
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
    { label: 'محادثة مصعّدة', value: 'conversation_assigned' },
    { label: 'رسالة جديدة', value: 'message_received' },
    { label: 'تعيين مهندس', value: 'engineer_assigned' },
    { label: 'إسناد تذكرة', value: 'ticket_assigned' },
  ];

  readonly readOptions = [
    { label: 'الكل', value: '' },
    { label: 'مقروء', value: true },
    { label: 'غير مقروء', value: false },
  ];

  ngOnInit() {
    this.notifService.loadStats();
    this.loadData();

    // Check for ID in query params to open detail modal
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (id) {
        setTimeout(() => {
          const notif = this.notifications.find((n: NotificationPayload) => n.id.toString() === id.toString());
          if (notif) {
            this.onRowClick(notif);
          }
        }, 800);
      }
    });
  }

  loadData() {
    this.notifService.loadNotifications(this.buildFilters());
  }

  private buildFilters(): NotificationFilters {
    const filters: NotificationFilters = {
      page: this.currentPage(),
      page_size: this.pageSize(),
      type: this.filterType(),
      is_read: this.filterIsRead(),
    };
    if (this.filterSearch()) {
      filters.search = this.filterSearch();
    }
    return filters;
  }

  onPageChange(event: { page: number; rows: number }) {
    this.currentPage.set(event.page);
    this.pageSize.set(event.rows);
    this.loadData();
  }

  onRowClick(notification: NotificationPayload) {
    this.selectedNotification.set(notification);
    this.showDetailModal.set(true);

    // Auto-mark as read when opened
    if (!notification.is_read) {
      this.notifService.markAsRead(notification.id).subscribe({
        next: (res) => {
          // No need to update local, service takes care of it
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
    this.filterIsRead.set('');
    this.filterSearch.set('');
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
      },
      error: () => this.isMarkingAll.set(false),
    });
  }

  deleteNotification(id: string | number) {
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
      conversation_assigned: 'محادثة جديدة',
      engineer_assigned: 'تعيين مهندس',
      message_received: 'رسالة جديدة',
      ticket_assigned: 'تذكرة جديدة',
    };
    return map[type] || type;
  }

  getTypeIcon(type: string): AppIconName {
    const map: Record<string, AppIconName> = {
      conversation_assigned: 'messageSquare',
      engineer_assigned: 'users',
      message_received: 'chat',
      ticket_assigned: 'ticket',
    };
    return map[type] || 'bell';
  }

  getTypeColor(type: string): string {
    const map: Record<string, string> = {
      conversation_assigned: '#8b5cf6',
      engineer_assigned: '#6366f1',
      message_received: '#0ea5e9',
      ticket_assigned: '#10b981',
    };
    return map[type] || '#6b7280';
  }

  getStatusColor(is_read: boolean): string {
    return is_read ? '#10b981' : '#f59e0b';
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
