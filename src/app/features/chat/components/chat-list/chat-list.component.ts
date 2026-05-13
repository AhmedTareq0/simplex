import { Component, input, output, signal, computed } from '@angular/core';
import { ChatListHeaderComponent } from '../chat-list-header/chat-list-header.component';
import { ChatSearchComponent } from '../chat-search/chat-search.component';
import { ChatConversationComponent } from '../chat-conversation/chat-conversation.component';
import { ChatFiltersComponent } from '../chat-filters/chat-filters.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [ChatListHeaderComponent, ChatSearchComponent, ChatConversationComponent, ChatFiltersComponent, CommonModule],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss',
})
export class ChatListComponent {
  readonly users = input<any[]>([]);
  readonly total = input(0);
  readonly currentUserId = input('');
  readonly accountPicture = input('');
  readonly lastMessages = input<Record<string, any>>({});
  readonly selectedUserId = input('');
  readonly onlineUsers = input<string[]>([]);
  readonly unreadCounts = input<Record<string, number>>({});
  
  readonly selectUser = output<any>();
  readonly search = output<string>();
  readonly filterChange = output<any>();
  readonly loadMore = output<void>();

  readonly searchText = signal('');
  readonly showFilters = signal(false);

  readonly filteredUsers = computed(() => {
    const search = this.searchText().toLowerCase();
    return this.users().filter(u =>
      !search || u.name?.toLowerCase().includes(search)
    );
  });

  onSearch(text: string) {
    this.searchText.set(text);
    this.search.emit(text);
  }

  toggleFilters() {
    this.showFilters.update(v => !v);
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
