import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonType = 'chat-list' | 'chat-message' | 'text' | 'avatar' | 'card' | 'table';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton-loader.component.html',
  styleUrls: ['./skeleton-loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkeletonLoaderComponent {
  @Input() type: SkeletonType = 'text';
  @Input() count = 1;
  @Input() rows = 3;

  get items(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }

  get textRows(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }
}
