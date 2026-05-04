import { Component, ChangeDetectionStrategy, signal, input, output, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { IconComponent, AppIconName } from '../../shared/components/icon/icon.component';
import { AuthLocalService } from '../../auth/services/auth-local.service';

export interface SidebarItem {
  link: string;
  title: string;
  icon?: AppIconName;
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
  private authService = inject(AuthLocalService);

  sidebarList = input.required<SidebarItem[]>();
  isMobileMenuOpen = input.required<boolean>();
  onToggleMobileMenu = output<void>();

  isCollapsed = signal(false);
  isLoggingOut = signal(false);

  toggleMobileMenu() {
    this.onToggleMobileMenu.emit();
  }

  toggleCollapse() {
    this.isCollapsed.update(val => !val);
  }

  logout() {
    this.isLoggingOut.set(true);
    this.authService.logout();
  }
}
