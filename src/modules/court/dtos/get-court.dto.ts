import { ApiProperty } from '@nestjs/swagger';
import { WeeklyScheduleDTO } from './create-court.dto';
import { CourtAmenities } from '../enums/court-amenities.enum';
import { CourtCategories } from '../enums/court-categories.enum';

export class GetCourtDTO {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  neighborhood: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  number: string;

  @ApiProperty()
  owner_id: string;

  @ApiProperty()
  weeklySchedule: WeeklyScheduleDTO;

  @ApiProperty()
  pricePerHour: number;

  @ApiProperty({ enum: CourtAmenities, isArray: true })
  amenities: CourtAmenities[];

  @ApiProperty({ enum: CourtCategories, isArray: true })
  categories: CourtCategories[];

  @ApiProperty()
  images: string[];

  @ApiProperty()
  status: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty()
  __v: number;

  @ApiProperty()
  user: {
    name: string;
    email: string;
    phone: string;
  };
}
