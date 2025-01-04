import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { CourtAmenities } from '../enums/court-amenities.enum';
import { CourtCategories } from '../enums/court-categories.enum';
import { User } from 'src/schema/user.schema';

export type CourtDocument = Court & Document;

@Schema({ timestamps: true })
export class Court {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  neighborhood: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  number: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  ownerId: User;

  @Prop({ type: [String], required: true })
  availableHours: string[];

  @Prop()
  reason?: string;

  @Prop({ required: true })
  price_per_hour: number;

  @Prop({ type: [String], enum: CourtAmenities, required: true })
  amenities: CourtAmenities[];

  @Prop({ type: [String], enum: CourtCategories, required: true })
  categories: CourtCategories[];

  @Prop({ type: [String], required: true })
  images: string[];
}

export const CourtSchema = SchemaFactory.createForClass(Court);
