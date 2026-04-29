import { Component, Input, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessageComponent } from '../chat-message/chat-message.component';
import { ChatFooterComponent } from '../chat-footer/chat-footer.component';

@Component({
  selector: 'app-chat-messages',
  standalone: true,
  imports: [CommonModule, ChatMessageComponent, ChatFooterComponent],
  templateUrl: './chat-messages.component.html',
  styleUrl: './chat-messages.component.scss',
})
export class ChatMessagesComponent implements AfterViewChecked {
  @Input() messages: any[] = [];
  @Input() currentUserId = '';
  @Input() users: any[] = [];

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  shouldScroll = signal(false);

  ngAfterViewChecked() {
    if (this.shouldScroll()) {
      this.scrollToBottom();
      this.shouldScroll.set(false);
    }
  }

  ngOnChanges() {
    this.shouldScroll.set(true);
  }

  scrollToBottom() {
    if (this.scrollContainer?.nativeElement) {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    }
  }

  isOwnMessage(message: any): boolean {
    return message?.senderId === this.currentUserId;
  }

  getSenderInfo(message: any): { name: string; picture: string } {
    const sender = this.users.find(u => u.sub === message?.senderId);
    return {
      name: sender?.name || 'Unknown',
      picture: sender?.picture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
    };
  }

  shouldShowSenderInfo(message: any, index: number): boolean {
    // Show sender info for received messages
    if (this.isOwnMessage(message)) return false;
    // Show if it's the first message or previous message is from different sender
    if (index === 0) return true;
    const prevMessage = this.messages[index - 1];
    return prevMessage?.senderId !== message?.senderId;
  }

  onSendMessage(text: string) {
    // placeholder - will be handled by parent
    console.log('Send message:', text);
  }

  onSendFile(file: File) {
    // placeholder - will be handled by parent
    console.log('Send file:', file);
  }
}
