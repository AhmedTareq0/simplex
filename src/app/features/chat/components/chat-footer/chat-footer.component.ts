import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-footer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-footer.component.html',
  styleUrl: './chat-footer.component.scss',
})
export class ChatFooterComponent {
  @Output() sendMessage = new EventEmitter<string>();
  @Output() sendFile = new EventEmitter<File>();

  messageText = signal('');

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.messageText().trim()) {
      this.sendMessage.emit(this.messageText());
      this.messageText.set('');
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.sendFile.emit(input.files[0]);
      input.value = '';
    }
  }
}
