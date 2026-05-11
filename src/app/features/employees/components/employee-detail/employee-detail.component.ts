import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModalComponent, IconComponent, ButtonComponent } from '../../../../shared/components';
import { Employee } from '../../services/employee.service';
import { AuthLocalService } from '../../../../auth/services/auth-local.service';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule, SharedModalComponent, ButtonComponent],
  templateUrl: './employee-detail.component.html',
  styleUrl: './employee-detail.component.scss'
})
export class EmployeeDetailComponent {
  readonly auth = inject(AuthLocalService);
  
  employee = input.required<Employee | null>();
  visible = input<boolean>(false);
  
  close = output<void>();
  edit = output<Employee>();

  formatDate(date: string | null): string {
    if (!date) return 'لم يسجل دخول بعد';
    return new Date(date).toLocaleDateString('ar-EG', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
