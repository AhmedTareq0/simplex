export const ticketStatusConfig = {
  chart: {
    type: 'donut' as const,
    height: 280,
    fontFamily: 'inherit',
  },
  labels: ['مفتوحة', 'قيد التنفيذ', 'مكتملة', 'مغلقة'],
  colors: ['#3b82f6', '#f59e0b', '#10b981', '#6366f1'],
  plotOptions: {
    pie: {
      donut: {
        size: '65%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'إجمالي التذاكر',
          },
        },
      },
    },
  },
  dataLabels: { enabled: false },
  legend: {
    position: 'bottom' as const,
    horizontalAlign: 'center' as const,
  },
  tooltip: {
    y: {
      formatter: (val: number) => `${val} تذكرة`,
    },
  },
};

export const monthlyTicketsConfig = {
  chart: {
    type: 'bar' as const,
    height: 280,
    fontFamily: 'inherit',
    toolbar: { show: false },
  },
  plotOptions: {
    bar: {
      borderRadius: 6,
      columnWidth: '45%',
    },
  },
  colors: ['#6ec1e4', '#61ce70'],
  dataLabels: { enabled: false },
  stroke: {
    show: true,
    width: 2,
    colors: ['transparent'],
  },
  xaxis: {
    categories: ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  },
  yaxis: {
    labels: {
      formatter: (val: number) => `${val}`,
    },
  },
  legend: {
    position: 'top' as const,
    horizontalAlign: 'left' as const,
  },
  tooltip: {
    y: {
      formatter: (val: number, opts?: any) => {
        const seriesName = opts?.w?.config?.series?.[opts.seriesIndex]?.name;
        const unit = seriesName === 'الزيارات' ? 'زيارة' : 'تذكرة';
        return `${val} ${unit}`;
      }
    },
  },
};

export const visitsTrendConfig = {
  chart: {
    type: 'area' as const,
    height: 280,
    fontFamily: 'inherit',
    toolbar: { show: false },
    sparkline: { enabled: false },
  },
  colors: ['#6ec1e4'],
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.45,
      opacityTo: 0.05,
      stops: [0, 100],
    },
  },
  dataLabels: { enabled: false },
  stroke: {
    curve: 'smooth' as const,
    width: 3,
  },
  xaxis: {
    categories: Array.from({ length: 24 }, (_, i) => `${i + 1}م`),
    tooltip: { enabled: false },
  },
  yaxis: {
    labels: {
      formatter: (val: number) => `${val}`,
    },
  },
  grid: {
    strokeDashArray: 4,
  },
  tooltip: {
    y: {
      formatter: (val: number) => `${val} زيارة`,
    },
  },
};
