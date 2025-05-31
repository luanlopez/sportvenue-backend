import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
  Delete,
  Put,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDTO } from './dtos/create-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { UserInterface } from '../auth/strategies/interfaces/user.interface';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LokiLoggerService } from 'src/common/logger/loki-logger.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserType } from '../../schema/user.schema';

@ApiTags('Events')
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly lokiLogger: LokiLoggerService,
  ) {}

  @Post()
  @Roles(UserType.HOUSE_OWNER)
  @ApiOperation({ summary: 'Create a new event' })
  @ApiBody({ type: CreateEventDTO })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  async createEvent(
    @User() user: UserInterface,
    @Body() createEventDto: CreateEventDTO,
  ) {
    await this.lokiLogger.info('Creating new event', {
      endpoint: '/events',
      method: 'POST',
      userId: user.id,
    });

    try {
      const result = await this.eventsService.create(user, createEventDto);
      await this.lokiLogger.info('Event created successfully', {
        endpoint: '/events',
        method: 'POST',
        eventId: result.id,
      });
      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to create event', error, {
        endpoint: '/events',
        method: 'POST',
        userId: user.id,
      });
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of all events' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'courtId', required: false, type: String })
  async getAllEvents(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('courtId') courtId?: string,
  ) {
    return this.eventsService.listEvents(page, limit, search, type, courtId);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming events' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUpcomingEvents(@Query('limit') limit = 5) {
    return this.eventsService.getUpcomingEvents(limit);
  }

  @Get(':id')
  @Roles(UserType.HOUSE_OWNER)
  @ApiOperation({ summary: 'Get event details' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async getEventById(@Param('id') id: string) {
    return this.eventsService.getEventById(id);
  }

  @Put(':id')
  @Roles(UserType.HOUSE_OWNER)
  @ApiOperation({ summary: 'Update an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiBody({ type: CreateEventDTO })
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: Partial<CreateEventDTO>,
  ) {
    return this.eventsService.updateEvent(id, updateEventDto);
  }

  @Delete(':id')
  @Roles(UserType.HOUSE_OWNER)
  @ApiOperation({ summary: 'Delete an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async deleteEvent(@Param('id') id: string) {
    return this.eventsService.deleteEvent(id);
  }
}
