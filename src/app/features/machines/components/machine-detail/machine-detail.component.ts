import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModalComponent, IconComponent, ButtonComponent } from '../../../../shared/components';
import { Machine } from '../../services/machine.service';

@Component({
  selector: 'app-machine-detail',
  standalone: true,
  imports: [CommonModule, SharedModalComponent, IconComponent, ButtonComponent],
  templateUrl: './machine-detail.component.html',
  styleUrl: './machine-detail.component.scss'
})
export class MachineDetailComponent {
  machine = input.required<Machine | null>();
  visible = input<boolean>(false);

  close = output<void>();
  edit = output<Machine>();

  formatPrice(price: number): string {
    return price ? `${price.toLocaleString('ar-EG')} ج.م` : 'مجاني';
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleString('ar-EG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusLabel(active: boolean | null | undefined): string {
    return active ? 'نشطة' : 'غير نشطة';
  }

  getFileName(url: string | null | undefined): string {
    if (!url) return '—';
    return decodeURIComponent(url.split('/').pop() || url);
  }
}
