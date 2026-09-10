import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { LinksService } from './links.service';
import { TelemetryQueryDto } from './dto/telemetry-query.dto';
import { telemetryWindowToMs } from './telemetry-window.mapper';
@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Get()
  findAll() {
    return this.linksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.linksService.findOne(id);
  }

  @Get(':id/telemetry')
  getTelemetry(@Param('id') id: string, @Query() query: TelemetryQueryDto) {
    const windowMs = telemetryWindowToMs(query.window);
    return this.linksService.getTelemetry(id, windowMs);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateLinkDto) {
    return this.linksService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLinkDto) {
    return this.linksService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.linksService.remove(id);
  }
}
