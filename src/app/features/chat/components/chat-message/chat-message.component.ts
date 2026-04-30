import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.scss',
})
export class ChatMessageComponent {
  @Input() message: any;
  @Input() isOwn = false;
  @Input() senderName = '';
  @Input() senderPicture = '';
  @Input() showSenderInfo = false;
  @Input() isGrouped = false; // consecutive messages from same sender

  @Output() replyTo = new EventEmitter<any>();

  showDropdown = signal(false);

  get isFile(): boolean {
    return this.message?.type === 'file';
  }

  get isPdf(): boolean {
    return this.message?.text?.includes('.pdf');
  }

  get isDeleted(): boolean {
    return this.message?.isDeleted;
  }

  get isReply(): boolean {
    return !!this.message?.replyTo;
  }

  get replyText(): string {
    return this.message?.replyTo?.text || '';
  }

  get status(): 'sent' | 'delivered' | 'read' {
    return this.message?.status || 'read';
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.showDropdown.update(v => !v);
  }

  closeDropdown() {
    this.showDropdown.set(false);
  }

  onReply() {
    this.replyTo.emit(this.message);
    this.closeDropdown();
  }

  onDelete() {
    console.log('Delete message:', this.message);
    this.closeDropdown();
  }

  onEdit() {
    console.log('Edit message:', this.message);
    this.closeDropdown();
  }

  formatTime(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
