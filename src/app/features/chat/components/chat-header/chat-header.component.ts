import { Component, input, signal, computed, inject, Output, EventEmitter } from '@angular/core';
import { IconComponent, SharedConfirmationComponent, SharedModalComponent, SharedSelectComponent } from '../../../../shared/components';
import { ChatService } from '../../services/chat.service';
import { AuthLocalService } from '@/auth/services/auth-local.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    SharedConfirmationComponent,
    SharedModalComponent,

  ],
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.scss',
})
export class ChatHeaderComponent {
  private readonly chatService = inject(ChatService);
  private readonly auth = inject(AuthLocalService);

  readonly person = input<any>(null);
  readonly isOnline = input(false);
  readonly isTyping = input(false);
  readonly conversationId = input('');
  readonly status = input('');

  @Output() close = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<string>();

  readonly showMenu = signal(false);
  readonly isRequestingVisit = signal(false);
  readonly isDeleting = signal(false);
  readonly showDeleteConfirm = signal(false);

  // Pop-up Form Signals
  readonly showVisitForm = signal(false);
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

  readonly canDeleteChat = computed(() => this.auth.hasPermission('chat.delete'));
  readonly canRequestVisit = computed(() => this.status() === 'with_customer_care' && this.auth.hasPermission('chat.cc'));
  readonly isWithEngineer = computed(() => this.status() === 'with_engineer');
  readonly hasMenuItems = computed(() => this.canRequestVisit() || this.isWithEngineer());

  toggleMenu(): void {
    this.showMenu.update(v => !v);
  }

  openVisitForm(): void {
    this.showVisitForm.set(true);
    // Reset Form
    this.visitIssueType.set('Maintenance');
    this.visitSubType.set('');
    this.visitPriority.set('normal');
    this.visitDescription.set('');
    this.visitSubTypeTouched.set(false);
    this.visitDescriptionTouched.set(false);
  }

  submitVisitRequest(): void {
    // Mark all as touched to show any potential errors
    this.visitSubTypeTouched.set(true);
    this.visitDescriptionTouched.set(true);

    if (!this.isVisitFormValid() || !this.conversationId() || this.isRequestingVisit()) return;

    this.isRequestingVisit.set(true);
    const metadata = {
      issue_type: this.visitIssueType(),
      sub_type: this.visitSubType(),
      priority: this.visitPriority(),
      description: this.visitDescription().trim()
    };

    this.chatService.requestVisit(this.conversationId(), metadata).subscribe({
      next: () => {
        this.isRequestingVisit.set(false);
        this.showVisitForm.set(false);
      },
      error: () => this.isRequestingVisit.set(false),
    });
  }

  onDeleteClick(): void {
    this.showDeleteConfirm.set(true);
    this.showMenu.set(false);
  }

  confirmDelete(): void {
    const id = this.conversationId();
    if (!id || this.isDeleting()) return;

    this.isDeleting.set(true);
    this.chatService.deleteConversation(id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.showDeleteConfirm.set(false);
        this.deleted.emit(id);
      },
      error: () => {
        this.isDeleting.set(false);
        this.showDeleteConfirm.set(false);
      },
    });
  }
}
