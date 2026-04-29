import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

export type SpinnerSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss'],
  imports: [ProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingSpinnerComponent {
  @Input() size: SpinnerSize = 'md';
  @Input() strokeWidth = 3;

  get spinnerClass(): string {
    return {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-9 h-9'
    }[this.size];
  }

  get spinnerStrokeWidth(): string {
    return String(this.strokeWidth);
  }
}
