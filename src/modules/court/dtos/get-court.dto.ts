import { ApiProperty } from '@nestjs/swagger';

export class UserDTO {
  @ApiProperty({ example: 'Luan Lopes', description: 'Name of the user' })
  name: string;

  @ApiProperty({
    example: 'luanlopesdasilva165@gmail.com',
    description: 'Email of the user',
  })
  email: string;

  @ApiProperty({
    example: '11999999999',
    description: 'Phone of the user',
  })
  phone?: string;
}
export class GetCourtDTO {
  @ApiProperty({
    example: '66e9dd3eba8209611a170971',
    description: 'ID of the court',
  })
  _id: string;

  @ApiProperty({ example: 'R. Xingu', description: 'Address of the court' })
  address: string;

  @ApiProperty({ example: 'Crispim', description: 'Neighborhood of the court' })
  neighborhood: string;

  @ApiProperty({
    example: 'Itapecerica da Serra - SP',
    description: 'City of the court',
  })
  city: string;

  @ApiProperty({ example: '130/262', description: 'Number of the court' })
  number: string;

  @ApiProperty({
    example: 'user_2lX2f8JuZMKeTlKjBQ4oia4JItX',
    description: 'ID of the owner',
  })
  owner_id: string;

  @ApiProperty({
    example: 'Campo do Imperial',
    description: 'Name of the court',
  })
  name: string;

  @ApiProperty({
    example: ['20:00', '21:00'],
    description: 'Available hours for the court',
  })
  availableHours: string[];

  @ApiProperty({
    example: [
      'https://ik.imagekit.io/pqxf1vesz/uploads/qa_evidencia_fk_202_4hiQZCfb1A.png',
    ],
    description: 'List of image URLs for the court',
  })
  images: string[];

  @ApiProperty({ example: true, description: 'Status of the court' })
  status: boolean;

  @ApiProperty({
    example: '2024-09-17T19:49:18.518Z',
    description: 'Creation date of the court',
  })
  createdAt: string;

  @ApiProperty({
    example: '2024-09-17T19:49:18.518Z',
    description: 'Last update date of the court',
  })
  updatedAt: string;

  @ApiProperty({ example: 0, description: 'Version key of the court' })
  __v: number;

  @ApiProperty({
    type: UserDTO,
    description: 'User details associated with the court',
  })
  user: UserDTO;

  @ApiProperty({
    example: ['Piso de concreto', 'Iluminação', 'Área de descanso'],
    description: 'List of amenities for the court',
  })
  amenities: string[];

  @ApiProperty({
    example: ['Futebol', 'Vôlei', 'Basquete'],
    description: 'List of categories for the court',
  })
  categories: string[];

  @ApiProperty({
    example: 100,
    description: 'Price per hour for the court',
  })
  price_per_hour: number;
}
