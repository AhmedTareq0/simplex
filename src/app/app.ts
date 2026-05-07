import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WebSocketService } from './core/services/websocket.service';
import { AuthLocalService } from './auth/services/auth-local.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('simplex-app');
  private readonly ws = inject(WebSocketService);
  private readonly authService = inject(AuthLocalService);

  ngOnInit() {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.ws.connect(token);
       this.authService.fetchCurrentUser();
    }
  }
}
