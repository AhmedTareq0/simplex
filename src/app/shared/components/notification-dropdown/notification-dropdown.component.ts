import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../icon/icon.component';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  avatarText?: string;
  time?: string;
  link?: string;
  queryParams?: Record<string, any>;
}

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './notification-dropdown.component.html',
  styleUrl: './notification-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationDropdownComponent {
  /** The list of notifications to display */
  notifications = input<NotificationItem[]>([]);
  
  /** Total count to show in the header badge and dropdown */
  count = input<number>(0);

  /** Label for the dropdown header */
  headerTitle = input<string>('الإشعارات');

  /** Link for "See all" at the bottom */
  viewAllLink = input<string>('/customer-support');

  /** Emits when a notification is clicked */
  itemClick = output<NotificationItem>();

  /** Emits when "View All" is clicked */
  viewAllClick = output<void>();

  readonly isOpen = signal(false);

  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }

  onItemClick(item: NotificationItem): void {
    this.itemClick.emit(item);
    this.close();
  }
}
