import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../icon/icon.component';
import { AiAssistantService } from '../../services/ai-assistant.service';
import { AiConversation } from '@/core/interfaces/ai-assistant.interface';

@Component({
  selector: 'app-ai-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './ai-sidebar.component.html',
  styleUrl: './ai-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiSidebarComponent {
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  private readonly aiService = inject(AiAssistantService);

  readonly searchQuery = signal<string>('');
  readonly editingConvId = signal<string | null>(null);

  readonly conversations = this.aiService.conversations;
  readonly activeConversation = this.aiService.activeConversation;

  readonly filteredConversations = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.conversations();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.machine_name && c.machine_name.toLowerCase().includes(q)) ||
        (c.last_message && c.last_message.toLowerCase().includes(q))
    );
  });

  close(): void {
    this.closeSidebar.emit();
  }

  openNewSession(): void {
    this.aiService.openNewSessionModal();
  }

  onSelectConversation(conv: AiConversation): void {
    this.aiService.selectConversation(conv);
    // On mobile or narrow screens, close drawer when opening chat
    if (window.innerWidth < 768) {
      this.close();
    }
  }

  isExpired(conv: AiConversation): boolean {
    return this.aiService.checkIsExpired(conv.expires_at);
  }

  getTtlLabel(conv: AiConversation): string {
    return this.aiService.formatTimeLeft(conv.expires_at);
  }

  formatDisplayTime(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  startInlineRename(convId: string): void {
    this.editingConvId.set(convId);
  }

  cancelInlineRename(): void {
    this.editingConvId.set(null);
  }

  saveInlineRename(convId: string, newTitle: string): void {
    if (newTitle.trim()) {
      this.aiService.renameConversation(convId, newTitle);
    }
    this.editingConvId.set(null);
  }

  deleteConversation(convId: string): void {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذه المحادثة من سجلك؟')) {
      this.aiService.deleteConversation(convId);
    }
  }
}
