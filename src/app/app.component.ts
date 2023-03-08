import { JsonPipe, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, effect, inject, signal } from '@angular/core';
import { EXCEPTION_SIGNAL } from './exception.signal';
@Component({
  selector: 'ng-root',
  standalone: true,
  imports: [NgIf, JsonPipe],
  template: `
    <h1>Angular 16 Signals sandbox</h1>
    <button (click)="onClickRequest()">👼🏼 Send a request!</button>
    <br />
    <button (click)="onClickError()">😈 Throw an Application error!</button>
    <br />
    <button (click)="onClickBadRequestHandled()">
      🥳 Send a handled bad request
    </button>
    <br />
    <button (click)="onClickBadRequest()">
      🤯 Send an unhandled bad request
    </button>
    <br />
    <div *ngIf="data()">
      <p>📦 Got data:</p>
      <pre>{{ data() | json }}</pre>
    </div>
    <div *ngIf="exception() as exception">
      <p>💣 Got an exception:</p>
      <pre>{{ exception | json }}</pre>
    </div>
  `,
})
export class AppComponent {
  #http = inject(HttpClient);
  exception = inject(EXCEPTION_SIGNAL);
  data = signal<object | null>(null);

  constructor() {
    effect(() => {
      const data = this.data();
      if (data) console.warn('📡 received data signal:', data);
      else console.log('🕳️ no data signal');
      const exception = this.exception();
      if (exception) console.warn('📡 received exception signal:', exception);
      else console.log('🕳️ no exception signal');
    });
  }

  onClickRequest() {
    const id = Math.floor(Math.random() * 500);
    this.#http
      .get('https://jsonplaceholder.typicode.com/comments/' + id)
      .subscribe((data) => this.data.set(data));
  }
  onClickBadRequest() {
    // ✅ HTTP errors intercepted are emitted and received as signals
    // ❌ HTTP errors catch by ErrorHandler are not received correctly
    this.#http
      .get('https://jsonplaceholder.typicode.com/comments/666')
      .subscribe((data) => this.data.set(data));
  }
  onClickBadRequestHandled() {
    // ✅ Errors handled are emitted and received as signals
    this.#http
      .get('https://jsonplaceholder.typicode.com/comments/666')
      .subscribe({
        next: (data) => this.data.set(data),
        error: (error) =>
          this.exception.set({
            message: error.message,
            category: 'Handled',
            timestamp: new Date().getUTCMilliseconds(),
          }),
      });
  }
  onClickError() {
    // ✅ Errors catch by errorhandler are emitted and received as signals
    throw new Error('Test error');
  }
}
