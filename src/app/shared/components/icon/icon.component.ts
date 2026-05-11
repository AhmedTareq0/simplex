import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

type IconPath = {
  d: string;
  strokeWidth?: number;
};

type IconDefinition = {
  viewBox: string;
  paths: IconPath[];
};

const ICONS = {
  close: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M6 18L18 6M6 6l12 12', strokeWidth: 2.25 }]
  },
  chat: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M8 12h.01M12 12h.01M16 12h.01' , strokeWidth: 2.5 },
      { d: 'M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z' }
    ]
  },
  clock: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M12 8v4l3 3M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0Z' }]
  },
  users: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M17 20h5v-2a3 3 0 0 0-5.36-1.86' },
      { d: 'M17 20H7m10 0v-2c0-.66-.13-1.28-.36-1.86' },
      { d: 'M7 20H2v-2a3 3 0 0 1 5.36-1.86' },
      { d: 'M7 20v-2c0-.66.13-1.28.36-1.86m0 0a5 5 0 0 1 9.28 0' },
      { d: 'M15 7a3 3 0 1 1-6 0a3 3 0 0 1 6 0Z' },
      { d: 'M21 10a2 2 0 1 1-4 0a2 2 0 0 1 4 0Z' },
      { d: 'M7 10a2 2 0 1 1-4 0a2 2 0 0 1 4 0Z' }
    ]
  },
  calendarClock: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M8 2v4M16 2v4M3 10h18' },
      { d: 'M5 5h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z' },
      { d: 'M12 14v-2.5l1.75-1' }
    ]
  },
  fileAlt: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z' },
      { d: 'M14 2v6h6' },
      { d: 'M9 13h6M9 17h6M9 9h1' }
    ]
  },
  table: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M19 11H5m14 0a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2m14 0V9a2 2 0 0 0-2-2M5 11V9a2 2 0 0 1 2-2m0 0V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M7 7h10' }]
  },
  search: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M21 21l-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0a7 7 0 0 1 14 0Z' }]
  },
  menu: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M4 6h16M4 12h16M4 18h16' }]
  },
  bell: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.44V11a6 6 0 0 0-4-5.66V5a2 2 0 1 0-4 0v.34A6 6 0 0 0 6 11v3.16c0 .54-.21 1.05-.6 1.44L4 17h5' },
      { d: 'M9 17a3 3 0 0 0 6 0' }
    ]
  },
  filter: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M3 5h18l-7 8v5l-4 2v-7L3 5Z' }]
  },
  print: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M7 9V4h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v6H7v-6Z' }]
  },
  briefcase: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M9 6V4h6v2M3 8h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z' }, { d: 'M3 12h18' }]
  },
  calendarPlus: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M8 2v4M16 2v4M3 10h18' },
      { d: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z' },
      { d: 'M12 14v6M9 17h6' }
    ]
  },
  fileEdit: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 20h9' },
      { d: 'M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1l1-4L16.5 3.5Z' }
    ]
  },
  plusCircle: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M12 8v8M8 12h8' }, { d: 'M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0Z' }]
  },
  moreVertical: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 5v.01' },
      { d: 'M12 12v.01' },
      { d: 'M12 19v.01' }
    ]
  },
  eye: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M2.46 12c1.27-4.06 5.06-7 9.54-7s8.27 2.94 9.54 7c-1.27 4.06-5.06 7-9.54 7s-8.27-2.94-9.54-7Z' },
      { d: 'M15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0Z' }
    ]
  },
  pencil: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M12 20h9M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1l1-4L16.5 3.5Z' }]
  },
  trash: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14M10 10v6M14 10v6' }]
  },
  inbox: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M4 13V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7M4 13l2.4 3a2 2 0 0 0 1.6.8h8a2 2 0 0 0 1.6-.8L20 13M4 13h4l2 3h4l2-3h4' }]
  },
  chevronDown: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'm6 9 6 6 6-6' }]
  },
  plus: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M12 5v14M5 12h14' }]
  },
  list: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', strokeWidth: 2.5 }]
  },
  listCheck: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'm3 12 2 2 4-4' },
      { d: 'M11 12h10M11 6h10M11 18h10' }
    ]
  },
  check: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'm5 13 4 4L19 7' }]
  },
  wallet: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v1H5.5A2.5 2.5 0 0 0 3 10.5v7A1.5 1.5 0 0 0 4.5 19H19a2 2 0 0 0 2-2v-6h-5a2 2 0 1 1 0-4h5' },
      { d: 'M16 14h.01' }
    ]
  },
  moneyBill: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M3 7h18v10H3z' },
      { d: 'M7 12h10' },
      { d: 'M7 9h.01M17 15h.01' }
    ]
  },
  receipt: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3Z' },
      { d: 'M9 8h6M9 12h6M9 16h4' }
    ]
  },
  idCard: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z' },
      { d: 'M8.5 12a2 2 0 1 0 0-4a2 2 0 0 0 0 4Z' },
      { d: 'M6.5 17a3 3 0 0 1 4 0' },
      { d: 'M13 8h5M13 12h5M13 16h3' }
    ]
  },
  spinner: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M21 12a9 9 0 1 1-6.22-8.56', strokeWidth: 2.5 }]
  },
  user: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M16 7a4 4 0 1 1-8 0a4 4 0 0 1 8 0Z' }, { d: 'M4 20a8 8 0 0 1 16 0' }]
  },
  star: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'm12 3 2.9 5.88 6.49.95-4.7 4.58 1.11 6.47L12 17.77l-5.8 3.11 1.11-6.47-4.7-4.58 6.49-.95L12 3Z' }]
  },
  cog: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z' },
      { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z' }
    ]
  },
  chartPie: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M21 12A9 9 0 1 1 11 3v9h10Z' }, { d: 'M13 3.5A9 9 0 0 1 20.5 11H13V3.5Z' }]
  },
  settings: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z' },
      { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z' }
    ]
  },
  camera: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z' },
      { d: 'M12 17a4 4 0 1 0 0-8a4 4 0 0 0 0 8Z' }
    ]
  },
  mail: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z' },
      { d: 'M22 6l-10 7L2 6' }
    ]
  },
  phone: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z' }]
  },
  save: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z' },
      { d: 'M17 21v-8H7v8M7 3v5h8' }
    ]
  },
  ticket: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2Z' }]
  },
  'message-circle': {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z' }]
  },
  'alert-triangle': {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z' },
      { d: 'M12 9v4M12 17h.01' }
    ]
  },
  'bar-chart-2': {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M18 20V10M12 20V4M6 20v-6' }]
  },
  lock: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Z' },
      { d: 'M7 11V7a5 5 0 0 1 10 0v4' }
    ]
  },
  monitor: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M20 3H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z' },
      { d: 'M8 21h8M12 17v4' }
    ]
  },
  smartphone: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z' },
      { d: 'M12 18h.01' }
    ]
  },
  sun: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 17a5 5 0 1 0 0-10a5 5 0 0 0 0 10Z' },
      { d: 'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42' }
    ]
  },
  layout: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M3 3h18v7H3zM3 14h8v7H3zM15 14h6v7h-6z' }
    ]
  },
  'check-circle': {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' },
      { d: 'm9 11 3 3L22 4' }
    ]
  },
  shield: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z' }]
  },
  info: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M12 16v-4m0-4h.01M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0Z' }]
  },
  sync: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15' }]
  },
  image: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z' }
    ]
  }
} satisfies Record<string, IconDefinition>; // Updated with image icon

export type AppIconName = keyof typeof ICONS;
export type IconSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
      <svg
      [attr.class]="'app-icon app-icon--' + size"
      [attr.viewBox]="iconDefinition.viewBox"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      [attr.aria-hidden]="decorative"
      [attr.aria-label]="decorative ? null : ariaLabel || name"
      [attr.role]="decorative ? 'presentation' : 'img'"
      stroke="currentColor"
    >
      @for (path of iconDefinition.paths; track path.d) {
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          [attr.stroke-width]="path.strokeWidth || 2"
          [attr.d]="path.d"
        />
      }
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 0;
      }

      .app-icon {
        display: block;
        flex: none;
      }

      .app-icon--sm {
        inline-size: 1rem;
        block-size: 1rem;
      }

      .app-icon--md {
        inline-size: 1.25rem;
        block-size: 1.25rem;
      }

      .app-icon--lg {
        inline-size: 1.5rem;
        block-size: 1.5rem;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconComponent {
  @Input() name: AppIconName = 'table';
  @Input() size: IconSize = 'md';
  @Input() decorative = true;
  @Input() ariaLabel = '';

  get iconDefinition(): IconDefinition {
    return ICONS[this.name] ?? ICONS.table;
  }
}
