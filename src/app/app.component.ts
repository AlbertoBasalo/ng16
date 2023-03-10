import { JsonPipe, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { EXCEPTION_SIGNAL } from './exception.signal';
@Component({
  selector: 'ng-root',
  standalone: true,
  imports: [NgIf, JsonPipe],
  template: `
    <h1>Angular 16 Signals sandbox</h1>
    <i>Check millisecond incoherences on async unhandled errors at console</i>
    <br />
    <button (click)="onClickRequest()">πΌπΌ Send a good request!</button>
    <br />
    <button (click)="onClickBadRequestHandled()">
      π₯³ Send a handled bad request
    </button>
    <br />
    <button (click)="onClickBadRequest()">
      π€― Send an unhandled bad request
    </button>
    <br />
    <button (click)="onClickError()">
      π€¬ Throw an common application error!
    </button>
    <br />
    <button (click)="onClickDelayedError()">
      πΉ Throw a Time delayed (async) error!
    </button>
    <br />
    <button (click)="onClickPromiseError()">
      πΏ Throw a Promise rejection error!
    </button>
    <br />
    <div *ngIf="data()">
      <p>π¦ Got data:</p>
      <pre>{{ data() | json }}</pre>
    </div>
    <div *ngIf="exception() as exception">
      <p>π£ Got an exception:</p>
      <pre>{{ exception | json }}</pre>
    </div>
  `,
})
export class AppComponent {
  #http = inject(HttpClient);
  #cdr = inject(ChangeDetectorRef); // hack to force c.d. on async errors
  exception = inject(EXCEPTION_SIGNAL);
  data = signal<object | null>(null);

  constructor() {
    effect(() => {
      const data = this.data();
      if (data) console.warn('π‘ received data signal:', data);
      else console.log('π³οΈ no data signal');
      const exception = this.exception();
      if (exception) {
        console.warn('π‘ received exception signal:', exception);
        // π¬ The cdr resolves the timeout error, but not the promise error
        this.#cdr.detectChanges();
      } else console.log('π³οΈ no exception signal');
    });
  }

  onClickRequest() {
    const id = Math.floor(Math.random() * 500);
    this.#http
      .get('https://jsonplaceholder.typicode.com/comments/' + id)
      .subscribe((data) => this.data.set(data));
  }
  onClickBadRequest() {
    // β HTTP errors intercepted are emitted and received as signals
    // β HTTP errors catch by ErrorHandler are not received correctly
    // π³οΈ Deactivate interceptors at main.ts to see it more clearly
    this.#http
      .get('https://jsonplaceholder.typicode.com/comments/666')
      .subscribe((data) => this.data.set(data));
  }
  onClickBadRequestHandled() {
    // β Errors handled are emitted and received as signals
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
    // β Errors catch by ErrorHandler are emitted and received as signals too.
    throw new Error('Test common error');
  }
  onClickDelayedError() {
    // β οΈ Delayed errors are not received correctly (except whe using the CDR)
    setTimeout(() => {
      throw new Error('Test delayed error');
    }, 1000);
  }
  onClickPromiseError() {
    // β Promises errors are not received correctly
    Promise.reject(new Error('Test promise rejected error'));
  }
}
