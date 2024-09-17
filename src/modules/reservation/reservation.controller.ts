import {
  Controller,
  Post,
  Body,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ReservationService } from './reservation.service';
import { CreateReservationDTO } from './dtos/create-reservation.dto';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiBody({ type: CreateReservationDTO })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Reservation created successfully.',
    type: ReservationSchema,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  async create(
    @Body() createReservationDto: CreateReservationDTO,
  ): Promise<ReservationDTO> {
    try {
      const reservation =
        await this.reservationService.create(createReservationDto);
      return reservation.toObject() as ReservationDTO;
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to create reservation',
        cause: error?.message,
      });
    }
  }

  // @Get()
  // @ApiOperation({ summary: 'Get all reservations with pagination' })
  // @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  // @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  // @ApiResponse({ status: HttpStatus.OK, description: 'List of reservations', type: [ReservationDTO] })
  // @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error.' })
  // async findAll(
  //   @Query('page') page: number = 1,
  //   @Query('limit') limit: number = 10,
  // ): Promise<{ data: ReservationDTO[]; total: number }> {
  //   try {
  //     const { data, total } = await this.reservationService.findAll(page, limit);
  //     return { data, total };
  //   } catch (error) {
  //     throw new InternalServerErrorException({
  //       message: 'Failed to get reservations',
  //       cause: error?.message,
  //     });
  //   }
  // }
}
