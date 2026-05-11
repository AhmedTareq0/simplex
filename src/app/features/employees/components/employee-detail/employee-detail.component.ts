import { Component, input, output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModalComponent, IconComponent, ButtonComponent } from '../../../../shared/components';
import { Employee, EmployeeService, EmployeeDetails } from '../../services/employee.service';
import { AuthLocalService } from '../../../../auth/services/auth-local.service';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule, SharedModalComponent, ButtonComponent, IconComponent],
  templateUrl: './employee-detail.component.html',
  styleUrl: './employee-detail.component.scss'
})
export class EmployeeDetailComponent implements OnInit {
  readonly auth = inject(AuthLocalService);
  readonly employeeService = inject(EmployeeService);
  
  employee = input.required<Employee | null>();
  visible = input<boolean>(false);
  
  close = output<void>();

  employeeDetails = signal<EmployeeDetails | null>(null);
  isLoadingDetails = signal(false);

  ngOnInit() {
    if (this.visible() && this.employee()?.id) {
      this.loadEmployeeDetails();
    }
  }

  loadEmployeeDetails() {
    const employeeId = this.employee()?.id;
    if (!employeeId) return;

    this.isLoadingDetails.set(true);
    this.employeeService.getEmployeeDetails(employeeId).subscribe({
      next: (res) => {
        this.employeeDetails.set(res.data || null);
        this.isLoadingDetails.set(false);
      },
      error: () => this.isLoadingDetails.set(false)
    });
  }
}
