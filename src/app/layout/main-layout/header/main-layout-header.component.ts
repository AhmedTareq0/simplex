import { ChangeDetectionStrategy, Component, computed, inject, OnInit, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '@/shared/components/icon/icon.component';
import { NotificationDropdownComponent, NotificationItem } from '@/shared/components/notification-dropdown/notification-dropdown.component';
import { ChatService } from '../../../features/chat/services/chat.service';
import { NotificationsService } from '../../../features/notifications/services/notifications.service';

@Component({
  selector: 'app-main-layout-header',
  standalone: true,
  imports: [IconComponent, RouterLink, NotificationDropdownComponent],
  templateUrl: './main-layout-header.component.html',
  styleUrl: './main-layout-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutHeaderComponent implements OnInit {
  readonly searchPlaceholder = 'ابحث في النظام...';
  readonly menuClick = output<void>();

  readonly isArabic = signal(true);
  private readonly chatService = inject(ChatService);
  private readonly notifService = inject(NotificationsService);

  readonly mappedNotifications = computed<NotificationItem[]>(() => {
    return this.notifService.notifications().slice(0, 5).map(n => ({
      id: String(n.id),
      title: n.title,
      description: n.body,
      avatarText: this.getInitial(n.type),
      time: this.formatTime(n.created_at),
      link: '/notifications',
      queryParams: { id: n.id }
    }));
  });

  readonly unreadNotifCount = computed(() => this.notifService.stats().unread);

  readonly chatUnreadCount = computed(() => {
    const counts = this.chatService.unreadCounts();
    return Object.values(counts).reduce((sum, c) => sum + c, 0);
  });

  private readonly userData = signal<any>(null);

  readonly userName = computed(() => this.userData()?.name ?? 'المدير');
  readonly userRole = computed(() => this.userData()?.employee_role ?? this.userData()?.user_type ?? 'Admin');
  readonly avatarUrl = computed(() => this.userData()?.avatar_url ?? 'https://ui-avatars.com/api/?name=Admin&background=6ec1e4&color=fff');

  ngOnInit() {
    const raw = localStorage.getItem('user');
    if (raw) {
      try {
        this.userData.set(JSON.parse(raw));
      } catch {
        this.userData.set(null);
      }
    }

    this.notifService.loadStats();
    this.notifService.loadNotifications({ page_size: 5 });
  }

  onNotificationClick(item: NotificationItem) {
    this.notifService.markAsRead(item.id).subscribe();
  }

  private getInitial(type: string): string {
    const map: Record<string, string> = {
      conversation_assigned: 'C',
      engineer_assigned: 'E',
      message_received: 'M',
      ticket_assigned: 'T',
    };
    return map[type] || 'N';
  }

  private formatTime(date: string): string {
    const diff = new Date().getTime() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} د`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} س`;
    return new Date(date).toLocaleDateString('ar-EG');
  }

  toggleLang() {
    this.isArabic.update(v => !v);
    document.documentElement.setAttribute('dir', this.isArabic() ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', this.isArabic() ? 'ar' : 'en');
  }
}
