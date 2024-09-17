import { ApiProperty } from '@nestjs/swagger';

export class ImageDetailsDTO {
  @ApiProperty()
  $id: string;

  @ApiProperty()
  bucketId: string;

  @ApiProperty()
  $createdAt: string;

  @ApiProperty()
  $updatedAt: string;

  @ApiProperty()
  $permissions: any[];

  @ApiProperty()
  name: string;

  @ApiProperty()
  signature: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  sizeOriginal: number;

  @ApiProperty()
  chunksTotal: number;

  @ApiProperty()
  chunksUploaded: number;
}

export class CourtWithImagesDTO {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  neighborhood: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  number: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: [ImageDetailsDTO] })
  images: ImageDetailsDTO[];

  @ApiProperty()
  owner_id: string;

  @ApiProperty({ type: [String] })
  availableHours: string[];

  @ApiProperty()
  status: boolean;

  @ApiProperty()
  reason: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
