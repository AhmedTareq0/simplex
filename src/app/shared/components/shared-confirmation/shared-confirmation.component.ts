import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModalComponent } from '../shared-modal/shared-modal.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-shared-confirmation',
  standalone: true,
  imports: [CommonModule, SharedModalComponent, IconComponent],
  templateUrl: './shared-confirmation.component.html',
  styleUrl: './shared-confirmation.component.scss',
})
export class SharedConfirmationComponent {
  @Input() visible = false;
  @Input() title = 'تأكيد الإجراء';
  @Input() message = 'هل أنت متأكد من القيام بهذا الإجراء؟';
  @Input() confirmLabel = 'تأكيد';
  @Input() cancelLabel = 'إلغاء';
  @Input() type: 'danger' | 'warning' | 'info' = 'info';
  @Input() isLoading = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cancelled.emit();
  }
}
