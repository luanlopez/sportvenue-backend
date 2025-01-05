import { ApiProperty } from '@nestjs/swagger';
import { WeeklyScheduleDTO } from './create-court.dto';
import { CourtAmenities } from '../enums/court-amenities.enum';
import { CourtCategories } from '../enums/court-categories.enum';

export class CourtDTO {
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
  user: {
    name: string;
    email: string;
    phone: string;
  };
}

export class GetCourtsResponseDTO {
  @ApiProperty({ type: [CourtDTO] })
  data: CourtDTO[];

  @ApiProperty()
  total: number;
}
