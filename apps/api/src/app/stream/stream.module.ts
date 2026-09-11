import { Module } from '@nestjs/common';

import { LinksModule } from '../links/links.module';
import { StreamController } from './stream.controller';
import { StreamService } from './stream.service';

@Module({
  imports: [LinksModule],
  controllers: [StreamController],
  providers: [StreamService],
})
export class StreamModule {}
