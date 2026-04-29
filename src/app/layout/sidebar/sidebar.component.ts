import { Component, ChangeDetectionStrategy, signal, input, output, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { IconComponent, AppIconName } from '../../shared/components/icon/icon.component';

export interface SidebarItem {
  link: string;
  title: string;
  icon?: AppIconName;
  comingSoon?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private router = inject(Router);

  sidebarList = input.required<SidebarItem[]>();
  isMobileMenuOpen = input.required<boolean>();
  onToggleMobileMenu = output<void>();

  isCollapsed = signal(false);

  toggleMobileMenu() {
    this.onToggleMobileMenu.emit();
  }

  toggleCollapse() {
    this.isCollapsed.update(val => !val);
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/auth/login']);
  }
}
