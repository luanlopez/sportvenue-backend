import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateCourtDTO {
  @IsString()
  address: string;

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
