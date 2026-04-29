import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-search.component.html',
  styleUrl: './chat-search.component.scss',
})
export class ChatSearchComponent {
  @Output() search = new EventEmitter<string>();

  searchText = signal('');

  onInput(value: string) {
    this.searchText.set(value);
    this.search.emit(value);
  }
}
