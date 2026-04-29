import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-shared-modal',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, IconComponent],
  templateUrl: './shared-modal.component.html',
  styleUrls: ['./shared-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SharedModalComponent {
  @Input() visible = false;
  @Input() title = '';
  @Input() width = '95vw';
  @Input() maxWidth = '40rem';
  @Input() resizable = false;
  @Input() dismissible = true;
  @Input() closeOnEscape = true;
  @Input() showCloseButton = true;
  @Input() contentClass = '';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  handleVisibleChange(visible: boolean): void {
    this.visible = visible;
    this.visibleChange.emit(visible);

    if (!visible) {
      this.closed.emit();
    }
  }

  close(): void {
    this.handleVisibleChange(false);
  }
}
