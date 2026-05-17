import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent, SidebarItem } from '../sidebar/sidebar.component';
import { MainLayoutHeaderComponent } from './header/main-layout-header.component';
import { AuthLocalService } from '@/auth/services/auth-local.service';
import { Permission } from '@/auth/roles';

interface NavItem {
  link: string;
  title: string;
  icon: SidebarItem['icon'];
  permissions: Permission[];
}

const NAV_ITEMS: NavItem[] = [
  { link: 'dashboard', title: 'لوحة التحكم', icon: 'chartPie', permissions: ['dashboard.view'] },
  { link: 'reports', title: 'التقارير', icon: 'chartPie', permissions: ['reports.view'] },
  { link: 'machines', title: 'الماكينات', icon: 'table', permissions: ['machines.view'] },
  { link: 'tickets', title: 'التذاكر', icon: 'calendarClock', permissions: ['tickets.view_all', 'tickets.view_cc', 'tickets.view_engineer'] },
  { link: 'visits', title: 'الزيارات', icon: 'mapMarker', permissions: ['visits.view_own', 'visits.view_all'] },
  { link: 'employees', title: 'الموظفين', icon: 'users', permissions: ['users.manage'] },
  { link: 'clients', title: 'العملاء', icon: 'user', permissions: ['users.manage'] },
  { link: 'chat', title: 'الدردشة', icon: 'chat', permissions: ['chat.cc', 'chat.engineer'] },
  { link: 'notifications', title: 'الإشعارات', icon: 'bell', permissions: ['notifications.view'] },
  { link: 'settings', title: 'الإعدادات', icon: 'cog', permissions: ['settings.view'] },
];

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, MainLayoutHeaderComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  private readonly auth = inject(AuthLocalService);

  readonly sidebarList = computed<SidebarItem[]>(() =>
    NAV_ITEMS.filter((item) => item.permissions.some(p => this.auth.hasPermission(p))).map(item => ({
      link: item.link,
      title: item.title,
      icon: item.icon
    }))
  );

  isMobileMenuOpen = signal(false);

  toggleMobileMenu() {
    this.isMobileMenuOpen.update((val) => !val);
  }
}
