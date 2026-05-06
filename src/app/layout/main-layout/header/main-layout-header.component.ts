import { ChangeDetectionStrategy, Component, computed, inject, OnInit, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '@/shared/components/icon/icon.component';
import { NotificationDropdownComponent } from '@/shared/components/notification-dropdown/notification-dropdown.component';
import { ChatService } from '../../../features/chat/services/chat.service';

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
  }

  toggleLang() {
    this.isArabic.update(v => !v);
    document.documentElement.setAttribute('dir', this.isArabic() ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', this.isArabic() ? 'ar' : 'en');
  }
}
