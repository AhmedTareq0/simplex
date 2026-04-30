import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModalComponent } from '../../../../shared/components/shared-modal/shared-modal.component';
import { ChatMessagesComponent } from '../../../chat/components/chat-messages/chat-messages.component';

export interface DetailUserData {
  id: string;
  name: string;
  machine: string;
  status: 'active' | 'inactive' | 'maintenance';
  visitDate: string;
  priority: 'low' | 'medium' | 'high';
}

@Component({
  selector: 'app-customer-support-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SharedModalComponent,
    ChatMessagesComponent,
  ],
  templateUrl: './customer-support-detail.component.html',
  styleUrl: './customer-support-detail.component.scss',
})
export class CustomerSupportDetailComponent implements OnChanges {
  @Input() visible = false;
  @Input() user: any = null;
  @Input() isEditing = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() editModeChange = new EventEmitter<boolean>();
  @Output() update = new EventEmitter<DetailUserData>();
  @Output() delete = new EventEmitter<string>();
  @Output() edit = new EventEmitter<DetailUserData>();

  editUser: DetailUserData = {
    id: '', name: '', machine: '', status: 'active', visitDate: '', priority: 'medium',
  };

  // Chat mock data
  currentUserId = 'u1';
  chatUsers = [
    { sub: 'u1', name: 'أنت', picture: 'https://ui-avatars.com/api/?name=Me&background=6366f1&color=fff' },
    { sub: 'u2', name: 'الدعم الفني', picture: 'https://ui-avatars.com/api/?name=Support&background=10b981&color=fff' },
  ];
  chatMessages: any[] = [];

  statusOptions = [
    { label: 'نشط', value: 'active' },
    { label: 'غير نشط', value: 'inactive' },
    { label: 'صيانة', value: 'maintenance' },
  ];

  priorityOptions = [
    { label: 'عالية', value: 'high' },
    { label: 'متوسطة', value: 'medium' },
    { label: 'منخفضة', value: 'low' },
  ];

  customerOptions = [
    { label: 'أحمد ناصر', value: 'أحمد ناصر' },
    { label: 'محمد مصطفى', value: 'محمد مصطفى' },
    { label: 'محمود علي', value: 'محمود علي' },
    { label: 'شركة الأمل', value: 'شركة الأمل' },
    { label: 'مصنع الشرق', value: 'مصنع الشرق' },
  ];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user']?.currentValue) {
      this.editUser = { ...this.user };
      this.loadMockMessages();
    }
  }

  loadMockMessages() {
    if (!this.user) return;
    this.chatMessages = [
      { id: '1', senderId: 'u2', text: `مرحباً، بخصوص ${this.user.machine}، ما هي المشكلة؟`, timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'text' },
      { id: '2', senderId: 'u1', text: 'المكنة توقفت عن العمل منذ الصباح', timestamp: new Date(Date.now() - 3000000).toISOString(), type: 'text' },
      { id: '3', senderId: 'u2', text: 'سيتم إرسال فريق الصيانة في أقرب وقت ممكن.', timestamp: new Date(Date.now() - 1800000).toISOString(), type: 'text' },
      { id: '4', senderId: 'u1', text: 'شكراً جزيلاً', timestamp: new Date(Date.now() - 900000).toISOString(), type: 'text' },
    ];
  }

  close() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.editModeChange.emit(false);
  }

  toggleEdit() {
    this.editModeChange.emit(!this.isEditing);
  }

  onEdit() {
    if (this.user) {
      this.edit.emit(this.user);
    }
  }

  onSave() {
    this.update.emit(this.editUser);
    this.toggleEdit();
  }

  onDelete() {
    if (this.user?.id) this.delete.emit(this.user.id);
  }

  getStatusLabel(status: string): string {
    return ({ active: 'نشط', inactive: 'غير نشط', maintenance: 'صيانة' } as any)[status] || status;
  }

  getStatusColor(status: string): string {
    return ({ active: 'var(--color-success)', inactive: 'var(--color-danger)', maintenance: 'var(--color-warning)' } as any)[status] || 'var(--color-text-secondary)';
  }

  getPriorityLabel(priority: string): string {
    return ({ high: 'عالية', medium: 'متوسطة', low: 'منخفضة' } as any)[priority] || priority;
  }
}
