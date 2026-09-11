import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EventSourceFactory {
  create(url: string): EventSource {
    return new EventSource(url);
  }
}
