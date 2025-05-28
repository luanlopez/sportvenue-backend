import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from '../../schema/events.schema';
import { CreateEventDTO } from './dtos/create-event.dto';
import { UserInterface } from '../auth/strategies/interfaces/user.interface';
import { CustomApiError } from 'src/common/errors/custom-api.error';
import { ErrorCodes } from 'src/common/errors/error-codes';
import { LokiLoggerService } from 'src/common/logger/loki-logger.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    private readonly lokiLogger: LokiLoggerService,
  ) {}

  async create(user: UserInterface, data: CreateEventDTO): Promise<Event> {
    try {
      const event = new this.eventModel({
        ...data,
        organizer: user.id,
      });

      return await event.save();
    } catch (error) {
      throw new InternalServerErrorException({
        message: error?.message,
        cause: error?.stack,
      });
    }
  }

  async getEventById(eventId: string): Promise<Event> {
    const event = await this.eventModel
      .findById(eventId)
      .populate('organizer', 'firstName lastName email phone')
      .populate('court')
      .exec();

    if (!event) {
      throw new CustomApiError(
        'Event not found',
        'The requested event does not exist',
        ErrorCodes.EVENT_NOT_FOUND,
        404,
      );
    }

    return event;
  }

  async updateEvent(
    eventId: string,
    updateData: Partial<CreateEventDTO>,
  ): Promise<Event> {
    const event = await this.eventModel
      .findByIdAndUpdate(eventId, updateData, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!event) {
      throw new CustomApiError(
        'Event not found',
        'The requested event does not exist',
        ErrorCodes.EVENT_NOT_FOUND,
        404,
      );
    }

    return event;
  }

  async deleteEvent(eventId: string): Promise<void> {
    const result = await this.eventModel.findByIdAndDelete(eventId).exec();

    if (!result) {
      throw new CustomApiError(
        'Event not found',
        'The requested event does not exist',
        ErrorCodes.EVENT_NOT_FOUND,
        404,
      );
    }
  }

  async listEvents(
    page: number = 1,
    limit: number = 10,
    search?: string,
    type?: string,
    courtId?: string,
  ) {
    const query: any = {};

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    }

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    if (courtId) {
      query.court = courtId;
    }

    const total = await this.eventModel.countDocuments(query);
    const events = await this.eventModel
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('organizer', 'firstName lastName email phone')
      .populate('court')
      .sort({ startDate: 1 })
      .exec();

    return {
      data: events,
      total,
    };
  }

  async getUpcomingEvents(limit: number = 5) {
    return this.eventModel
      .find({
        startDate: { $gte: new Date() },
      })
      .populate('organizer', 'firstName lastName email phone')
      .populate('court')
      .sort({ startDate: 1 })
      .limit(limit)
      .exec();
  }
}
