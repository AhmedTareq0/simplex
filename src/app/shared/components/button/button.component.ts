import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { IconComponent, type AppIconName } from '../icon/icon.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonIconPosition = 'start' | 'end';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, IconComponent, LoadingSpinnerComponent],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  @Input() label = '';
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() icon?: AppIconName;
  @Input() iconPosition: ButtonIconPosition = 'start';
  @Input() block = false;

  @Output() pressed = new EventEmitter<MouseEvent>();

  get isDisabled(): boolean {
    return this.disabled || this.loading;
  }

  get buttonClassList(): string[] {
    return [
      'app-button',
      `app-button--${this.variant}`,
      `app-button--${this.size}`,
      this.block ? 'app-button--block' : ''
    ].filter(Boolean);
  }

  onClick(event: MouseEvent): void {
    if (this.isDisabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.pressed.emit(event);
  }
}
