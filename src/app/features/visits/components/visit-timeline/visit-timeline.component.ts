import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, AppIconName } from '@/shared/components';
import { TimelineItem } from '../../services/visits.service';

@Component({
  selector: 'app-visit-timeline',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './visit-timeline.component.html',
  styleUrl: './visit-timeline.component.scss'
})
export class VisitTimelineComponent {
  items = input<TimelineItem[]>([]);

  getIcon(type: TimelineItem['type']): AppIconName {
    return ({
      status_change: 'sync',
      note: 'fileAlt',
      assignment: 'plusCircle',
      cancellation: 'xCircle',
      reschedule: 'calendarPlus',
      sync: 'sync'
    } as Record<string, AppIconName>)[type] || 'table';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('ar-EG', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusLabel(status: string): string {
    return ({
      new: 'جديدة',
      scheduled: 'مجدولة',
      in_progress: 'قيد التنفيذ',
      done: 'مكتملة',
      completed: 'مكتملة',
      cancelled: 'ملغاة'
    } as Record<string, string>)[status] || status;
  }
}
