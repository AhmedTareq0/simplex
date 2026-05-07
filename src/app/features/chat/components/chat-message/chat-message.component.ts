import { Component, input, output, signal, HostListener } from '@angular/core';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [],
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.scss',
})
export class ChatMessageComponent {
  readonly message = input<any>(null);
  readonly isOwn = input(false);
  readonly senderName = input('');
  readonly senderPicture = input('');
  readonly showSenderInfo = input(false);
  readonly isGrouped = input(false);
  readonly replyTo = output<any>();

  readonly showDropdown = signal(false);

  get isFile(): boolean { return this.message()?.type === 'file'; }
  get isPdf(): boolean { return this.message()?.text?.includes('.pdf'); }
  get isDeleted(): boolean { return !!this.message()?.isDeleted; }
  get isReply(): boolean { return !!this.message()?.replyTo; }
  get replyText(): string { return this.message()?.replyTo?.text || ''; }
  get status(): 'sent' | 'delivered' | 'read' { return this.message()?.status || 'read'; }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.showDropdown.update(v => !v);
  }

  closeDropdown() { this.showDropdown.set(false); }

  onReply() {
    this.replyTo.emit(this.message());
    this.closeDropdown();
  }

  onDelete() { this.closeDropdown(); }
  onEdit() { this.closeDropdown(); }

  formatTime(date: string | Date): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  @HostListener('document:click')
  onDocumentClick() {
    if (this.showDropdown()) {
      this.showDropdown.set(false);
    }
  }
}
