import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IconComponent, ButtonComponent, SharedTableComponent, TableColumn, SkeletonLoaderComponent, SharedSelectComponent, SharedDatepickerComponent } from '../../../shared/components';
import { DashboardService, DashboardStats } from '../services/dashboard.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule, IconComponent, ButtonComponent, SharedTableComponent, SkeletonLoaderComponent, SharedSelectComponent, SharedDatepickerComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly isLoading = signal(false);
  readonly reportData = signal<DashboardStats | null>(null);

  readonly timeRangeOptions = signal([
    { label: 'آخر 30 يوم', value: '30d' },
    { label: 'الشهر الحالي', value: 'this-month' },
    { label: 'الربع السنوي', value: 'quarter' },
    { label: 'السنة الحالية', value: 'year' }
  ]);

  readonly departmentOptions = signal([
    { label: 'الكل', value: 'all' },
    { label: 'خدمة العملاء', value: 'customer-care' },
    { label: 'الدعم الفني', value: 'tech-support' },
    { label: 'الصيانة الميدانية', value: 'maintenance' }
  ]);

  readonly selectedTimeRange = signal('30d');
  readonly selectedDepartment = signal('all');
  readonly selectedAgent = signal<string | null>(null);
  readonly rangeDates = signal<Date[] | null>(null);

  readonly workloadChartOptions = signal<any>({
    chart: { type: 'donut', height: 350 },
    labels: [],
    series: [],
    colors: ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
    legend: { position: 'bottom' },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: { show: true, label: 'الإجمالي' }
          }
        }
      }
    }
  });

  readonly performanceColumns: TableColumn[] = [
    { field: 'name', header: 'الموظف', type: 'text' },
    { field: 'resolved', header: 'تذاكر محلولة', type: 'number' },
    { field: 'satisfaction', header: 'نسبة الرضا', type: 'text', formatter: (val: any) => `${val}%` },
    { field: 'avgResponse', header: 'سرعة الاستجابة', type: 'text' }
  ];

  ngOnInit() {
    this.loadReportData();
  }

  onFilterChange() {
    this.loadReportData();
  }

  loadReportData() {
    this.isLoading.set(true);
    // Reusing DashboardService logic for now, could be expanded to a dedicated ReportsService
    this.dashboardService.getDashboardData().subscribe({
      next: (data: DashboardStats) => {
        this.reportData.set(data);
        this.workloadChartOptions.update(prev => ({
          ...prev,
          labels: data.workloadDistribution.labels,
          series: data.workloadDistribution.series
        }));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  exportReport(type: 'pdf' | 'excel') {
    console.log(`Exporting as ${type}...`);
    // Placeholder for export logic
    alert(`جاري تجهيز ملف الـ ${type.toUpperCase()}...`);
  }
}
