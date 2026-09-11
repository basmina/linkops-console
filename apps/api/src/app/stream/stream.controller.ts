import {
  Controller,
  Headers as NestHeaders,
  MessageEvent,
  Sse,
} from '@nestjs/common';

import { Observable, map } from 'rxjs';

import { StreamService } from './stream.service';

@Controller('stream')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Sse()
  stream(
    @NestHeaders('last-event-id')
    lastEventId?: string,
  ): Observable<MessageEvent> {
    const parsedLastEventId =
      lastEventId !== undefined ? Number(lastEventId) : undefined;

    const validLastEventId =
      parsedLastEventId !== undefined &&
      Number.isInteger(parsedLastEventId) &&
      parsedLastEventId >= 0
        ? parsedLastEventId
        : undefined;

    return this.streamService.getEvents(validLastEventId).pipe(
      map((frame): MessageEvent => {
        const message: MessageEvent = {
          type: frame.event.type,
          data: frame.event,
          retry: 3000,
        };

        if ('id' in frame) {
          message.id = String(frame.id);
        }

        return message;
      }),
    );
  }
}
