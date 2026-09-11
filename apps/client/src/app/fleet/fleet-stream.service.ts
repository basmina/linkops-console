import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LinkStreamEvent } from '@linkops-console/link';
import { EventSourceFactory } from './event-source.factory';
@Injectable({
  providedIn: 'root',
})
export class FleetStreamService {
  private readonly eventSourceFactory = inject(EventSourceFactory);
  connect(): Observable<LinkStreamEvent> {
    return new Observable<LinkStreamEvent>((subscriber) => {
      const source = this.eventSourceFactory.create('/api/stream');

      const eventHandler = (event: MessageEvent<string>) => {
        try {
          const data = JSON.parse(event.data) as LinkStreamEvent;

          subscriber.next(data);
        } catch {
          subscriber.error(new Error('Invalid SSE payload'));
        }
      };

      source.addEventListener('telemetry', eventHandler);
      source.addEventListener('status', eventHandler);
      source.addEventListener('summary', eventHandler);

      source.onerror = () => {
        // EventSource automatically reconnects.
      };

      return () => {
        source.close();
      };
    });
  }
}
