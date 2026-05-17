import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon/icon.component';
import type { AppIconName } from '../../shared/components/icon/icon.component';
import { AuthLocalService } from '../../auth/services/auth-local.service';

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  ticketUpdates: boolean;
  chatMessages: boolean;
  systemAlerts: boolean;
  weeklyReport: boolean;
}

interface SecurityForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.scss',
})
export class ProfileSettingsComponent implements OnInit {
  readonly authService = inject(AuthLocalService);

  activeTab = signal<'profile' | 'notifications' | 'security'>('profile');
  saveSuccess = signal(false);
  isLoading = signal(false);
  isChangingPassword = signal(false);
  passwordError = signal<string | null>(null);
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  avatarPreview = signal<string | null>(null);

  // Read from the auth service signal — stays in sync automatically
  readonly user = this.authService.currentUser;

  // Derived display values
  readonly displayName = computed(() => this.user()?.name || '');
  readonly displayEmail = computed(() => this.user()?.email || '');
  readonly displayPhone = computed(() => this.user()?.phone || '');
  readonly displayDepartment = computed(() => this.user()?.department || '');
  readonly displayRole = computed(() => this.user()?.employee_role || '');
  readonly displayAvatar = computed(() => this.user()?.avatar_url || null);

  readonly initials = computed(() => {
    const name = this.user()?.name || '';
    return name.split(' ').map(w => w.charAt(0)).slice(0, 2).join('').toUpperCase();
  });

  notifications: NotificationSettings = {
    emailNotifications: true,
    pushNotifications: true,
    ticketUpdates: true,
    chatMessages: true,
    systemAlerts: false,
    weeklyReport: true,
  };

  security: SecurityForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  tabs: { key: 'profile' | 'notifications' | 'security'; label: string; icon: AppIconName }[] = [
    { key: 'profile', label: 'الملف الشخصي', icon: 'user' },
    { key: 'notifications', label: 'الإشعارات', icon: 'bell' },
    { key: 'security', label: 'الأمان', icon: 'shield' },
  ];

  ngOnInit() {
    // Refresh user data when settings page opens
    this.authService.fetchCurrentUser();
  }

  setTab(tab: 'profile' | 'notifications' | 'security') {
    this.activeTab.set(tab);
  }

  onAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (e) => this.avatarPreview.set(e.target?.result as string);
      reader.readAsDataURL(input.files[0]);
    }
  }

  saveProfile() {
    // Profile is read-only from API — just show success for now
    this.saveSuccess.set(true);
    setTimeout(() => this.saveSuccess.set(false), 3000);
  }

  saveNotifications() {
    this.saveSuccess.set(true);
    setTimeout(() => this.saveSuccess.set(false), 3000);
  }

  changePassword() {
    if (!this.passwordsMatch || !this.security.currentPassword) return;

    this.isChangingPassword.set(true);
    this.passwordError.set(null);

    this.authService.changePassword({
      old_password: this.security.currentPassword,
      new_password: this.security.newPassword,
    }).subscribe({
      next: () => {
        // Session cleared & redirected to login by AuthLocalService
        // No need to do anything here — clearSession() handles navigation
      },
      error: (err) => {
        this.isChangingPassword.set(false);
        const message = err?.error?.message || 'حدث خطأ أثناء تغيير كلمة المرور';
        this.passwordError.set(message);
      },
    });
  }

  get passwordsMatch(): boolean {
    return (
      this.security.newPassword.length > 0 &&
      this.security.newPassword === this.security.confirmPassword
    );
  }
}
