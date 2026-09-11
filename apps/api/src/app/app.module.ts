import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { LinksModule } from './links/links.module';
import { StreamModule } from './stream/stream.module';
import { HttpExceptionFilter } from './common/http-exception.filter';

@Module({
  imports: [LinksModule, StreamModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
