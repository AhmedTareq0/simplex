import { Component } from '@angular/core';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  template: `
    <div class="coming-soon">
      <div class="coming-soon__content">
        <h1>Coming Soon</h1>
        <p>This feature is under development. Stay tuned!</p>
      </div>
    </div>
  `,
  styles: [
    `
      .coming-soon {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        padding: var(--space-6);
      }

      .coming-soon__content {
        text-align: center;
        padding: var(--space-12);
        background: var(--color-surface);
        border-radius: var(--radius-xl);
        border: var(--border-thin) solid var(--color-border);
      }

      h1 {
        font-size: var(--text-3xl);
        color: var(--color-text-primary);
        margin-bottom: var(--space-4);
      }

      p {
        font-size: var(--text-base);
        color: var(--color-text-secondary);
      }
    `,
  ],
})
export class ComingSoonComponent {}
