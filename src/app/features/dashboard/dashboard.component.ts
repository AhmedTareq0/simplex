import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IconComponent, SharedTableComponent, TableColumn, ButtonComponent, SharedDatepickerComponent } from '../../shared/components';
import { FormsModule } from '@angular/forms';

import { DashboardService, DashboardStats } from './services/dashboard.service';
import { AdminSyncService } from '../../core/services/admin-sync.service';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { ticketStatusConfig, monthlyTicketsConfig, visitsTrendConfig } from './chart-config';
import { formatArabicDateTime } from '../../core/utils/date.util';
import { VISIT_STATUS, PRIORITY } from '@/core/constants/status.constants';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule, IconComponent, SharedTableComponent, ButtonComponent, SharedDatepickerComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly syncService = inject(AdminSyncService);

  readonly summaryCards = signal<any[]>([]);
  readonly dailyVisits = signal<any[]>([]);
  readonly isLoading = signal(true);
  readonly rangeDates = signal<Date[] | null>(null);

  // Pagination  
  readonly visitPage = signal(1);
  readonly visitPageSize = signal(5);
  readonly visitTotal = signal(0);

  readonly ticketStatusData = signal<number[]>([0, 0, 0, 0]);
  readonly dailyStats = signal<any[]>([]);
  readonly weeklyStats = signal<any[]>([]);
  readonly monthlyStats = signal<any[]>([]);
  readonly topAgents = signal<any[]>([]);

  readonly activeTab = signal<'visits' | 'tickets'>('visits');
  readonly activePeriod = signal<'daily' | 'weekly' | 'monthly'>('daily');
  readonly activeChatPeriod = signal<'daily' | 'weekly' | 'monthly'>('monthly');
  readonly activeStatusPeriod = signal<'daily' | 'weekly' | 'monthly'>('monthly');

  private dataSubscription?: Subscription;

  readonly visitColumns: TableColumn[] = [
    { field: 'name', header: 'كود الزيارة', type: 'text', filterable: true },
    { field: 'customer_name', header: 'العميل', type: 'text', filterable: true },
    { field: 'engineer_name', header: 'المهندس', type: 'text', filterable: true },
    {
      field: 'date',
      header: 'تاريخ ووقت الزيارة',
      type: 'text',
      filterable: true,
      formatter: formatArabicDateTime
    },
    {
      field: 'priority',
      header: 'الأولوية',
      type: 'badge',
      formatter: (val: string) => PRIORITY.getLabel(val)
    },
    {
      field: 'status',
      header: 'الحالة',
      type: 'badge',
      formatter: (val: string) => VISIT_STATUS.getLabel(val)
    }
  ];

  readonly tableLabels = {
    total: 'إجمالي السجلات',
    searchPlaceholder: 'بحث في البيانات...',
    actionsHeader: 'تعديل'
  };

  readonly ticketStatusOptions = computed(() => {
    const series = this.ticketStatusData();
    return {
      ...ticketStatusConfig,
      series: series,
      plotOptions: {
        pie: {
          donut: {
            ...ticketStatusConfig.plotOptions.pie.donut,
            labels: {
              show: true,
              total: {
                show: true,
                label: 'إجمالي التذاكر',
                formatter: (w: any) => {
                  const sum = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                  return String(sum);
                },
              },
            },
          },
        },
      },
    };
  });

  readonly monthlyTicketsOptions = computed(() => {
    const period = this.activeChatPeriod();
    const daily = this.dailyStats();
    const weekly = this.weeklyStats();
    const monthly = this.monthlyStats();

    let ticketsData: number[] = [];
    let visitsData: number[] = [];
    let categories: string[] = [];

    if (period === 'daily') {
      const reversed = [...daily].reverse();
      ticketsData = reversed.map(d => d.tickets?.count || 0);
      visitsData = reversed.map(d => d.visits?.count || 0);
      categories = reversed.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
      });
    } else if (period === 'weekly') {
      ticketsData = weekly.map(w => w.tickets?.count || 0);
      visitsData = weekly.map(w => w.visits?.count || 0);
      categories = weekly.map(w => `أسبوع ${w.week_number}`);
    } else if (period === 'monthly') {
      const reversed = [...monthly].reverse();
      ticketsData = reversed.map(m => m.tickets?.count || 0);
      visitsData = reversed.map(m => m.visits?.count || 0);
      categories = reversed.map(m => {
        const [year, month] = (m.month || '').split('-');
        const monthNames = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        return monthNames[parseInt(month, 10) - 1] || m.label || m.month;
      });
    }

    return {
      ...monthlyTicketsConfig,
      series: [
        { name: 'التذاكر', data: ticketsData },
        { name: 'الزيارات', data: visitsData }
      ],
      xaxis: {
        ...monthlyTicketsConfig.xaxis,
        categories: categories
      }
    };
  });

  readonly visitsTrendOptions = computed(() => {
    const tab = this.activeTab();
    const period = this.activePeriod();
    const daily = this.dailyStats();
    const weekly = this.weeklyStats();
    const monthly = this.monthlyStats();

    let seriesData: number[] = [];
    let categories: string[] = [];
    const tooltipFormatter = (val: number) => `${val} ${tab === 'visits' ? 'زيارة' : 'تذكرة'}`;

    if (period === 'daily') {
      const reversed = [...daily].reverse();
      seriesData = reversed.map(d => tab === 'visits' ? (d.visits?.count || 0) : (d.tickets?.count || 0));
      categories = reversed.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
      });
    } else if (period === 'weekly') {
      seriesData = weekly.map(w => tab === 'visits' ? (w.visits?.count || 0) : (w.tickets?.count || 0));
      categories = weekly.map(w => `أسبوع ${w.week_number}`);
    } else if (period === 'monthly') {
      const reversed = [...monthly].reverse();
      seriesData = reversed.map(m => tab === 'visits' ? (m.visits?.count || 0) : (m.tickets?.count || 0));
      categories = reversed.map(m => {
        const [, month] = (m.month || '').split('-');
        const monthNames = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        return monthNames[parseInt(month, 10) - 1] || m.label || m.month;
      });
    }

    const color = tab === 'visits' ? '#22c55e' : '#3b82f6';

    return {
      ...visitsTrendConfig,
      series: [
        {
          name: tab === 'visits' ? 'تدفق الزيارات' : 'تدفق التذاكر',
          data: seriesData
        }
      ],
      colors: [color],
      xaxis: {
        ...visitsTrendConfig.xaxis,
        categories: categories
      },
      tooltip: {
        ...visitsTrendConfig.tooltip,
        y: {
          formatter: tooltipFormatter
        }
      }
    };
  });

  readonly isSyncing = this.syncService.isSyncing;

  ngOnInit() {
    this.startAutoRefresh();
  }

  onSyncAll() {
    this.syncService.syncAll().subscribe({
      next: () => this.onRefreshCache(),
      error: () => { }
    });
  }

  onRefreshCache() {
    this.dashboardService.refreshCache().subscribe({
      next: () => this.refreshData(),
      error: () => this.refreshData()
    });
  }

  refreshData() {
    this.isLoading.set(true);
    this.visitPage.set(1);


    const dates = this.rangeDates();
    const from = dates?.[0] ? dates[0].toISOString().split('T')[0] : undefined;
    const to = dates?.[1] ? dates[1].toISOString().split('T')[0] : undefined;

    this.dashboardService.getDashboardData(from, to).subscribe({
      next: (data) => this.applyData(data),
      error: () => this.isLoading.set(false)
    });
  }

  private applyData(data: DashboardStats) {
    this.summaryCards.set(data.summaryCards);
    this.ticketStatusData.set(data.ticketStatus);
    this.dailyStats.set(data.dailyStats);
    this.weeklyStats.set(data.weeklyStats);
    this.monthlyStats.set(data.monthlyStats);
    this.dailyVisits.set(data.recentVisits);
    this.visitTotal.set(data.recentVisitsTotal || 0);
    this.topAgents.set(data.topAgents);
    this.isLoading.set(false);
  }

  onVisitPageChange(event: { page: number; rows: number }) {
    this.visitPage.set(event.page);
    this.visitPageSize.set(event.rows);
    this.dashboardService.getRecentVisits(event.page, event.rows).subscribe({
      next: (res) => {
        this.dailyVisits.set(res.items);
        this.visitTotal.set(res.total);
      }
    });
  }

  private startAutoRefresh() {
    this.dataSubscription = interval(120000)
      .pipe(
        startWith(0),
        switchMap(() => {
          this.isLoading.set(true);
          const dates = this.rangeDates();
          const from = dates?.[0] ? dates[0].toISOString().split('T')[0] : undefined;
          const to = dates?.[1] ? dates[1].toISOString().split('T')[0] : undefined;
          return this.dashboardService.getDashboardData(from, to);
        })
      )
      .subscribe({
        next: (data) => this.applyData(data),
        error: () => this.isLoading.set(false)
      });
  }

  ngOnDestroy() {
    this.dataSubscription?.unsubscribe();
  }
}
