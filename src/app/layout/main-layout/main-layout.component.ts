import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent, SidebarItem } from '../sidebar/sidebar.component';
import { MainLayoutHeaderComponent } from './header/main-layout-header.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, MainLayoutHeaderComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  readonly sidebarList = signal<SidebarItem[]>([
    { link: 'dashboard', title: 'لوحة التحكم', icon: 'chartPie' },
    { link: 'reports', title: 'التقارير', icon: 'chartPie' },
    { link: 'machines', title: 'الماكينات', icon: 'table' },
    { link: 'tickets', title: 'التذاكر', icon: 'calendarClock' },
    { link: 'visits', title: 'الزيارات', icon: 'mapMarker' },
    { link: 'employees', title: 'الموظفين', icon: 'users' },
    { link: 'clients', title: 'العملاء', icon: 'user' },
    { link: 'chat', title: 'الدردشة', icon: 'chat' },
    { link: 'notifications', title: 'الإشعارات', icon: 'bell' },
    { link: 'settings', title: 'الإعدادات', icon: 'cog' },
  ]);

  isMobileMenuOpen = signal(false);

  toggleMobileMenu() {
    this.isMobileMenuOpen.update((val) => !val);
  }
}
