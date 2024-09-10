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
  name: string;

  @ApiProperty({ type: [ImageDetailsDTO] })
  images: ImageDetailsDTO[];
}
