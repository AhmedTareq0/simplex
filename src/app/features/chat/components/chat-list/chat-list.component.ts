import { Component, input, output, signal, computed } from '@angular/core';
import { ChatListHeaderComponent } from '../chat-list-header/chat-list-header.component';
import { ChatSearchComponent } from '../chat-search/chat-search.component';
import { ChatConversationComponent } from '../chat-conversation/chat-conversation.component';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [ChatListHeaderComponent, ChatSearchComponent, ChatConversationComponent],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss',
})
export class ChatListComponent {
  readonly users = input<any[]>([]);
  readonly currentUserId = input('');
  readonly accountPicture = input('');
  readonly lastMessages = input<Record<string, any>>({});
  readonly selectedUserId = input('');
  readonly onlineUsers = input<string[]>([]);
  readonly unreadCounts = input<Record<string, number>>({});
  readonly selectUser = output<any>();

  readonly searchText = signal('');

  readonly filteredUsers = computed(() => {
    const search = this.searchText().toLowerCase();
    return this.users().filter(u =>
      !search || u.name?.toLowerCase().includes(search)
    );
  });

  onSearch(text: string) {
    this.searchText.set(text);
  }

  getLastMessage(userId: string): any {
    return this.lastMessages()[userId] ?? null;
  }

  getUnreadCount(userId: string): number {
    return this.unreadCounts()[userId] ?? 0;
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers().includes(userId);
  }
}
