import { Component, EventEmitter, Input, Output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '@/shared/components/icon/icon.component';
import { SharedModalComponent } from '@/shared/components/shared-modal/shared-modal.component';

@Component({
  selector: 'app-request-visit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, SharedModalComponent],
  templateUrl: './request-visit-modal.component.html',
  styleUrl: './request-visit-modal.component.scss'
})
export class RequestVisitModalComponent {
  @Input() visible = false;
  @Input() isSubmitting = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() submitted = new EventEmitter<any>();

  // Pop-up Form Signals
  readonly visitIssueType = signal('Maintenance');
  readonly visitSubType = signal('');
  readonly visitPriority = signal('normal');
  readonly visitDescription = signal('');

  readonly priorityOptions = [
    { label: 'منخفضة', value: 'low' },
    { label: 'عادية', value: 'normal' },
    { label: 'عالية', value: 'high' },
    { label: 'حرجة / طارئة', value: 'urgent' }
  ];

  readonly issueTypeOptions = [
    { label: 'صيانة (Maintenance)', value: 'Maintenance' },
    { label: 'تركيب (Installation)', value: 'Installation' }
  ];

  readonly maintenanceSubTypes = [
    { label: 'ميكانيكا (Mechanical)', value: 'Mechanical' },
    { label: 'كهرباء (Electrical)', value: 'Electrical' },
    { label: 'تشغيل (Operating)', value: 'Operating' },
    { label: 'دورية (Periodic)', value: 'Periodic' }
  ];

  readonly installationSubTypes = [
    { label: 'غير راوتر (Non-router)', value: 'Non-router' },
    { label: 'تجميع (Assembled)', value: 'Assembled' },
    { label: 'فايبر ليزر (Fiber Laser G, N, NP)', value: 'Fiber Laser G OR N OR NP' },
    { label: 'فايبر ليزر (Fiber Laser H Model)', value: 'Fiber Laser H Model' },
    { label: 'تناية ومقص (Press Bending & Shearing)', value: 'Press Bending&SHEARING Machine' },
    { label: 'مخرطة (Lathe)', value: 'lathe' }
  ];

  // Validation Touched flags
  readonly visitSubTypeTouched = signal(false);
  readonly visitDescriptionTouched = signal(false);

  // Field validation error computations
  readonly visitSubTypeError = computed(() => {
    if (!this.visitSubTypeTouched()) return '';
    const val = this.visitSubType();
    if (!val) return 'التفاصيل مطلوبة';
    return '';
  });

  readonly visitDescriptionError = computed(() => {
    if (!this.visitDescriptionTouched()) return '';
    const val = this.visitDescription().trim();
    if (!val) return 'وصف المشكلة مطلوب';
    if (val.length < 10) return 'يجب أن يكون الوصف 10 أحرف على الأقل';
    return '';
  });

  readonly isVisitFormValid = computed(() => {
    const subTypeVal = this.visitSubType();
    const descVal = this.visitDescription().trim();

    if (!subTypeVal) return false;
    if (!descVal || descVal.length < 10) return false;

    return true;
  });

  constructor() {
    effect(() => {
      if (this.visible) {
        this.resetForm();
      }
    });
  }

  resetForm(): void {
    this.visitIssueType.set('Maintenance');
    this.visitSubType.set('');
    this.visitPriority.set('normal');
    this.visitDescription.set('');
    this.visitSubTypeTouched.set(false);
    this.visitDescriptionTouched.set(false);
  }

  setIssueType(type: string): void {
    if (this.visitIssueType() !== type) {
      this.visitIssueType.set(type);
      this.visitSubType.set('');
      this.visitSubTypeTouched.set(false);
    }
  }

  setSubType(type: string): void {
    this.visitSubType.set(type);
    this.visitSubTypeTouched.set(true);
  }

  onVisibleChange(val: boolean): void {
    this.visible = val;
    this.visibleChange.emit(val);
  }

  close(): void {
    this.onVisibleChange(false);
  }

  submit(): void {
    this.visitSubTypeTouched.set(true);
    this.visitDescriptionTouched.set(true);

    if (!this.isVisitFormValid()) return;

    this.submitted.emit({
      issue_type: this.visitIssueType(),
      sub_type: this.visitSubType(),
      priority: this.visitPriority(),
      description: this.visitDescription().trim()
    });
  }
}
