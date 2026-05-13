import { Component, input, Output, EventEmitter } from '@angular/core';
import { ChatHeaderComponent } from '../chat-header/chat-header.component';
import { ChatMessagesComponent } from '../chat-messages/chat-messages.component';

@Component({
  selector: 'app-chat-box',
  standalone: true,
  imports: [ChatHeaderComponent, ChatMessagesComponent],
  templateUrl: './chat-box.component.html',
  styleUrl: './chat-box.component.scss',
})
export class ChatBoxComponent {
  readonly person = input<any>(null);
  readonly messages = input<any[]>([]);
  readonly currentUserId = input('');
  readonly conversationId = input('');
  readonly isOnline = input(false);
  readonly isTyping = input(false);
  readonly userName = input('');
  readonly users = input<any[]>([]);

  @Output() deleted = new EventEmitter<string>();
}
