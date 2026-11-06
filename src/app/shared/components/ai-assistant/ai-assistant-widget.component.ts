import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { AiSidebarComponent } from './components/ai-sidebar/ai-sidebar.component';
import { AiNewSessionModalComponent } from './components/ai-new-session-modal/ai-new-session-modal.component';
import { AiChatBoxComponent } from './components/ai-chat-box/ai-chat-box.component';
import { AiAssistantService } from './services/ai-assistant.service';

@Component({
  selector: 'app-ai-assistant-widget',
  standalone: true,
  imports: [
    CommonModule,
    IconComponent,
    AiSidebarComponent,
    AiNewSessionModalComponent,
    AiChatBoxComponent,
  ],
  templateUrl: './ai-assistant-widget.component.html',
  styleUrl: './ai-assistant-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiAssistantWidgetComponent {
  private readonly aiService = inject(AiAssistantService);

  readonly isSidebarOpen = this.aiService.isSidebarOpen;
  readonly isChatOpen = this.aiService.isChatOpen;
  readonly isChatMinimized = this.aiService.isChatMinimized;
  readonly isNewSessionModalOpen = this.aiService.isNewSessionModalOpen;

  toggleSidebar(): void {
    this.aiService.toggleSidebar();
  }

  closeSidebar(): void {
    this.aiService.closeSidebar();
  }

  onModalVisibleChange(v: boolean): void {
    if (!v) {
      this.aiService.closeNewSessionModal();
    }
  }

  closeChat(): void {
    this.aiService.closeChat();
  }

  minimizeChat(): void {
    this.aiService.minimizeChat();
  }
}
