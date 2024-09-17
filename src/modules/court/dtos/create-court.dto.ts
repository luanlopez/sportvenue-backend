import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateCourtDTO {
  @IsString()
  address: string;

  @IsString()
  neighborhood: string;

  @IsString()
  city: string;

  @IsString()
  number: string;

  @IsString()
  owner_id: string;

  @IsString()
  name: string;

  @IsArray()
  availableHours: string[];

  @IsOptional()
  @IsString()
  reason?: string;
}
