import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Button } from 'primeng/button';
import { WebSocketService } from './core/services/websocket.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Button],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('simplex-app');
  private readonly ws = inject(WebSocketService);

  ngOnInit() {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.ws.connect(token);
    }
  }
}
