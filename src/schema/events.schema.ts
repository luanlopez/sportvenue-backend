import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';
import { Court } from './court.schema';

export enum EventType {
  TOURNAMENT = 'TOURNAMENT',
  LEAGUE = 'LEAGUE',
  FRIENDLY_MATCH = 'FRIENDLY_MATCH',
}

export enum StreamingPlatform {
  YOUTUBE = 'YOUTUBE',
  TWITCH = 'TWITCH',
  INSTAGRAM = 'INSTAGRAM',
  TIKTOK = 'TIKTOK',
  OTHER = 'OTHER',
}

export type EventDocument = Event & Document;

@Schema({ timestamps: true })
export class Event {
  @Prop()
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  image: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Court',
    required: true,
  })
  courtId: Court;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  organizer: User;

  @Prop({ type: Number, default: 0 })
  price: number;

  @Prop({ type: String, enum: EventType, required: true })
  type: EventType;

  @Prop({ type: Boolean, default: false })
  isLive: boolean;

  @Prop({ type: String, enum: StreamingPlatform })
  streamingPlatform?: StreamingPlatform;

  @Prop()
  streamingUrl?: string;

  @Prop({ type: String })
  rules: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);

EventSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

EventSchema.pre('save', async function (next) {
  if (this.isNew) {
    const CourtModel = this.model('Court');
    await CourtModel.findByIdAndUpdate(this.courtId, {
      $push: { events: this._id },
    });
  }
  next();
});

EventSchema.pre('deleteOne', { document: true }, async function (next) {
  const CourtModel = this.model('Court');
  await CourtModel.findByIdAndUpdate(this.courtId, {
    $pull: { events: this._id },
  });
  next();
});
