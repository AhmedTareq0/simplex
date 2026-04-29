import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatListHeaderComponent } from '../chat-list-header/chat-list-header.component';
import { ChatSearchComponent } from '../chat-search/chat-search.component';
import { ChatConversationComponent } from '../chat-conversation/chat-conversation.component';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, ChatListHeaderComponent, ChatSearchComponent, ChatConversationComponent],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss',
})
export class ChatListComponent {
  @Input() users: any[] = [];
  @Input() currentUserId = '';
  @Input() accountPicture = '';
  @Input() lastMessages: Record<string, any> = {};
  @Input() selectedUserId = '';

  @Output() selectUser = new EventEmitter<any>();

  searchText = '';

  get filteredUsers(): any[] {
    if (!this.searchText) return this.users.filter(u => u.sub !== this.currentUserId);
    const lower = this.searchText.toLowerCase();
    return this.users.filter(u => u.sub !== this.currentUserId && u.name?.toLowerCase().includes(lower));
  }

  onSearch(text: string) {
    this.searchText = text;
  }

  onSelectUser(user: any) {
    this.selectUser.emit(user);
  }

  getLastMessage(userId: string): any {
    return this.lastMessages[userId] || null;
  }
}
