import { Component, input, output, signal } from '@angular/core';
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

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('ar-EG', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }
}
