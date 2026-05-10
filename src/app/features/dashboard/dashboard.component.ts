import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SharedTableComponent, TableColumn } from '../../shared/components/shared-table/shared-table.component';

import { summaryCards } from '../../data/dashboard/summary-cards.data';
import { ticketStatusValues, ticketTotal, monthlyTicketsValues, visitsTrendValues } from '../../data/dashboard/chart-values.data';
import { dailyVisits } from '../../data/dashboard/daily-visits.data';
import { topAgents } from '../../data/dashboard/top-agents.data';
import { ticketStatusConfig, monthlyTicketsConfig, visitsTrendConfig } from './chart-config';
import { MachineService, Machine } from './services/machine.service';
import { MachineEditModalComponent } from './components/machine-edit-modal/machine-edit-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, IconComponent, SharedTableComponent, MachineEditModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly machineService = inject(MachineService);

  readonly summaryCards = summaryCards;
  readonly dailyVisits: any[] = dailyVisits;
  readonly topAgents = topAgents;
  readonly machines = signal<Machine[]>([]);
  readonly selectedMachine = signal<Machine | null>(null);
  readonly isUpdatingMachine = signal(false);

  machineColumns: TableColumn[] = [
    { field: 'image_url', header: 'الصورة', type: 'image' },
    { field: 'display_name', header: 'الاسم', type: 'text', filterable: true },
    { 
      field: 'description', 
      header: 'الوصف', 
      type: 'text',
      formatter: (val: string) => val && val.length > 60 ? val.substring(0, 60) + '...' : (val || '-')
    },
    { field: 'type', header: 'النوع', type: 'text' },
    {
      field: 'list_price',
      header: 'السعر',
      type: 'number',
      formatter: (val: number) => val ? `${val} ر.س` : 'مجاني'
    },
    { 
      field: 'document_url', 
      header: 'الكتالوج', 
      type: 'link', 
      linkText: 'تحميل', 
      icon: 'fileAlt' 
    }
  ];

  readonly visitColumns: TableColumn[] = [
    { field: 'date', header: 'التاريخ', type: 'date', filterable: true },
    { field: 'count', header: 'عدد الزيارات', type: 'number' },
    { field: 'uniqueUsers', header: 'زوار فريدون', type: 'number' },
    { field: 'averageTime', header: 'متوسط الوقت', type: 'text' },
    {
      field: 'status',
      header: 'الحالة',
      type: 'badge',
      formatter: (val: string) => {
        switch (val) {
          case 'high': return 'مرتفع';
          case 'normal': return 'طبيعي';
          case 'low': return 'منخفض';
          default: return String(val);
        }
      }
    }
  ];

  readonly tableLabels = {
    total: 'إجمالي السجلات',
    searchPlaceholder: 'بحث في البيانات...',
    actionsHeader: 'تعديل'
  };

  readonly ticketStatusOptions = {
    ...ticketStatusConfig,
    series: ticketStatusValues,
    plotOptions: {
      pie: {
        donut: {
          ...ticketStatusConfig.plotOptions.pie.donut,
          labels: {
            show: true,
            total: {
              show: true,
              label: 'إجمالي التذاكر',
              formatter: () => String(ticketTotal),
            },
          },
        },
      },
    },
  };

  readonly monthlyTicketsOptions = {
    ...monthlyTicketsConfig,
    series: monthlyTicketsValues,
  };

  readonly visitsTrendOptions = {
    ...visitsTrendConfig,
    series: visitsTrendValues,
  };

  isSyncingMachines = signal(false);

  ngOnInit() {
    this.machineService.getMachines().subscribe(data => {
      this.machines.set(data);
    });
  }

  syncMachines() {
    this.isSyncingMachines.set(true);
    this.machineService.syncMachines().subscribe({
      next: (res) => {
        this.isSyncingMachines.set(false);
        if (res.success) {
          this.machineService.getMachines().subscribe(data => this.machines.set(data));
        }
      },
      error: () => this.isSyncingMachines.set(false)
    });
  }

  openEditModal(machine: Machine) {
    this.selectedMachine.set(machine);
  }

  closeEditModal() {
    this.selectedMachine.set(null);
  }

  handleUpdateMachine(formData: FormData) {
    const machine = this.selectedMachine();
    if (!machine) return;

    this.isUpdatingMachine.set(true);
    this.machineService.updateMachine(machine.id, formData).subscribe({
      next: (res) => {
        this.isUpdatingMachine.set(false);
        if (res.success) {
          this.closeEditModal();
          // Reload machines
          this.machineService.getMachines().subscribe(data => this.machines.set(data));
        }
      },
      error: () => this.isUpdatingMachine.set(false)
    });
  }
}
