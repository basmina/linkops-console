import { TestBed } from '@angular/core/testing';

import { EventSourceFactory } from './event-source.factory';

describe('EventSourceFactory', () => {
  let factory: EventSourceFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EventSourceFactory],
    });

    factory = TestBed.inject(EventSourceFactory);
  });

  it('should create an EventSource for the provided URL', () => {
    const close = vi.fn();

    class MockEventSource {
      constructor(public readonly url: string) {}

      close(): void {
        close();
      }
    }

    const originalEventSource = globalThis.EventSource;

    Object.defineProperty(globalThis, 'EventSource', {
      configurable: true,
      writable: true,
      value: MockEventSource,
    });

    try {
      const eventSource = factory.create('/api/stream');

      expect(eventSource.url).toBe('/api/stream');

      eventSource.close();

      expect(close).toHaveBeenCalledOnce();
    } finally {
      Object.defineProperty(globalThis, 'EventSource', {
        configurable: true,
        writable: true,
        value: originalEventSource,
      });
    }
  });
});
