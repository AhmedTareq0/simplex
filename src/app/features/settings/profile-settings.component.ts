import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon/icon.component';
import type { AppIconName } from '../../shared/components/icon/icon.component';

interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  bio: string;
  language: string;
}

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
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.scss',
})
export class ProfileSettingsComponent {
  activeTab = signal<'profile' | 'notifications' | 'security'>('profile');
  saveSuccess = signal(false);
  avatarPreview = signal<string | null>(null);

  profile: ProfileForm = {
    firstName: 'أحمد',
    lastName: 'محمد',
    email: 'ahmed.mohamed@simplex.com',
    phone: '+966 50 123 4567',
    role: 'مشرف دعم العملاء',
    department: 'خدمة العملاء',
    bio: 'مشرف متخصص في دعم العملاء مع خبرة تزيد عن 5 سنوات في إدارة فرق الدعم الفني.',
    language: 'ar',
  };

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

  languages = [
    { value: 'ar', label: 'العربية' },
    { value: 'en', label: 'English' },
 
  ];

  setTab(tab: 'profile' | 'notifications' | 'security') {
    this.activeTab.set(tab);
  }

  onAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.avatarPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  saveProfile() {
    this.saveSuccess.set(true);
    setTimeout(() => this.saveSuccess.set(false), 3000);
  }

  saveNotifications() {
    this.saveSuccess.set(true);
    setTimeout(() => this.saveSuccess.set(false), 3000);
  }

  changePassword() {
    if (this.security.newPassword !== this.security.confirmPassword) return;
    this.security = { currentPassword: '', newPassword: '', confirmPassword: '' };
    this.saveSuccess.set(true);
    setTimeout(() => this.saveSuccess.set(false), 3000);
  }

  get initials(): string {
    return `${this.profile.firstName.charAt(0)}${this.profile.lastName.charAt(0)}`;
  }

  get passwordsMatch(): boolean {
    return (
      this.security.newPassword.length > 0 &&
      this.security.newPassword === this.security.confirmPassword
    );
  }
}
