import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent, ButtonComponent, SharedTableComponent, TableColumn, SkeletonLoaderComponent, SharedSelectComponent, SharedDatepickerComponent } from '../../../shared/components';
import { ReportsService, ReportsSummary, TeamPerformanceItem } from '../services/reports.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ButtonComponent, SharedTableComponent, SkeletonLoaderComponent, SharedSelectComponent, SharedDatepickerComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent implements OnInit {
  private readonly reportsService = inject(ReportsService);

  readonly isLoading = signal(false);
  readonly summary = signal<ReportsSummary | null>(null);
  readonly teamPerformance = signal<TeamPerformanceItem[]>([]);

  // Filter options loaded from backend metadata
  readonly departmentOptions = signal<{ label: string; value: string }[]>([]);
  readonly employeeOptions = signal<{ label: string; value: number }[]>([]);

  readonly selectedDepartment = signal('all');
  readonly selectedAgent = signal<number | null>(null);
  readonly rangeDates = signal<Date[] | null>([
    new Date(new Date().setDate(new Date().getDate() - 30)),
    new Date()
  ]);

  // Search and Pagination signals (100% matched to API)
  readonly searchText = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly totalRecords = signal(0);

  // Sorting signals (100% matched to API)
  readonly sortBy = signal('');
  readonly sortOrder = signal('desc');

  readonly sortByOptions = signal([
    { label: 'الافتراضي', value: '' },
    { label: 'التذاكر المحلولة', value: 'resolved_tickets_count' },
    { label: 'نسبة الرضا', value: 'satisfaction_percentage' },
    { label: 'سرعة الاستجابة', value: 'average_response_time_minutes' }
  ]);

  readonly sortOrderOptions = signal([
    { label: 'تنازلي', value: 'desc' },
    { label: 'تصاعدي', value: 'asc' }
  ]);


  readonly performanceColumns: TableColumn[] = [
    { field: 'employee_name', header: 'الموظف', type: 'text' },
    { field: 'resolved_tickets_count', header: 'تذاكر محلولة', type: 'number' },
    { field: 'open_tickets_count', header: 'تذاكر مفتوحة', type: 'number' },
    { field: 'resolved_visits_count', header: 'زيارات محلولة', type: 'number' },
    { field: 'open_visits_count', header: 'زيارات مفتوحة', type: 'number' },
    { field: 'satisfaction_percentage', header: 'نسبة الرضا', type: 'number', formatter: (val: any) => val != null ? `${val}%` : '—' },
    { field: 'average_response_time_minutes', header: 'سرعة الاستجابة', type: 'number', formatter: (val: any) => val != null ? `${val} د` : '—' }
  ];

  ngOnInit() {
    this.loadFiltersMetadata();
    this.loadReportData();
  }

  loadFiltersMetadata() {
    this.reportsService.getFiltersMetadata().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const deptOpts = [
            { label: 'الكل', value: 'all' },
            ...res.data.departments.map(d => ({ label: d, value: d }))
          ];
          this.departmentOptions.set(deptOpts);

          const empOpts = res.data.employees.map(e => ({ label: e.name, value: e.id }));
          this.employeeOptions.set(empOpts);
        }
      }
    });
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadReportData();
  }

  onPageChange(event: { page: number; rows: number }) {
    this.currentPage.set(event.page);
    this.pageSize.set(event.rows);
    this.loadReportData();
  }

  private searchTimeout: any;
  onSearchChange(value: string) {
    this.searchText.set(value);
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadReportData();
    }, 400);
  }

  private getDatesFromRange(): { start_date?: string; end_date?: string } {
    const dates = this.rangeDates();
    if (dates && dates[0]) {
      const start = this.formatLocalDate(dates[0]);
      const end = dates[1] ? this.formatLocalDate(dates[1]) : start;
      return { start_date: start, end_date: end };
    }
    return {};
  }

  private formatLocalDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  loadReportData() {
    this.isLoading.set(true);
    const { start_date, end_date } = this.getDatesFromRange();
    const department = this.selectedDepartment();
    const agentVal = this.selectedAgent();
    const employee_id = (agentVal && typeof agentVal === 'object')
      ? (agentVal as any).value
      : (agentVal || undefined);

    const params = { start_date, end_date, department, employee_id };

    // Fetch Summary KPI
    this.reportsService.getSummary(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.summary.set(res.data);
        }
      }
    });

    this.reportsService.getTeamPerformance({
      ...params,
      search: this.searchText() || undefined,
      page: this.currentPage(),
      page_size: this.pageSize(),
      sort_by: this.sortBy() || undefined,
      sort_order: this.sortOrder() || undefined
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          let items = res.data.items || [];
          if (employee_id) {
            items = items.filter(item => item.employee_id === Number(employee_id));
          }
          this.teamPerformance.set(items);
          this.totalRecords.set(items.length || 0);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  exportReport(type: 'pdf' | 'excel') {
    const { start_date, end_date } = this.getDatesFromRange();
    const department = this.selectedDepartment();
    const agentVal = this.selectedAgent();
    const employee_id = (agentVal && typeof agentVal === 'object')
      ? (agentVal as any).value
      : (agentVal || undefined);
    const params = { start_date, end_date, department, employee_id };

    if (type === 'excel') {
      this.reportsService.exportExcelBlob(params).subscribe({
        next: (blob) => {
          this.downloadBlob(blob, `team_performance_report_${new Date().toISOString().split('T')[0]}.xls`);
        }
      });
    } else {
      this.reportsService.exportPdfHtml(params).subscribe({
        next: (htmlContent) => {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
          }
        }
      });
    }
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  getSatisfactionStars(score: number): number[] {
    const rounded = Math.round(score || 0);
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }
}
