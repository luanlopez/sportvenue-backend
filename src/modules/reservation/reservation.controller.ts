import {
  Controller,
  Post,
  Body,
  HttpStatus,
  InternalServerErrorException,
  Patch,
  Param,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { ReservationService } from './reservation.service';
import { CreateReservationDTO } from './dtos/create-reservation.dto';
import { Reservation } from 'src/schema/reservation.schema';

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
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  async create(
    @Body() createReservationDto: CreateReservationDTO,
  ): Promise<Reservation> {
    try {
      const reservation =
        await this.reservationService.create(createReservationDto);
      return reservation.toObject() as Reservation;
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to create reservation',
        cause: error?.message,
      });
    }
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a reservation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reservation approved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  async approve(@Param('id') id: string): Promise<Reservation> {
    try {
      return await this.reservationService.updateReservationStatus(
        id,
        'approved',
      );
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to approve reservation',
        cause: error?.message,
      });
    }
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a reservation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reservation rejected successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  async reject(@Param('id') id: string): Promise<Reservation> {
    try {
      return await this.reservationService.updateReservationStatus(
        id,
        'rejected',
      );
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to reject reservation',
        cause: error?.message,
      });
    }
  }

  @Get('owner/:ownerId')
  @ApiOperation({
    summary: 'List reservations by ownerId with pagination and status filter',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Reservation status',
    example: 'approved',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of reservations',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  async findByOwnerWithPagination(
    @Param('ownerId') ownerId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
  ): Promise<{ data: Reservation[]; total: number }> {
    try {
      return await this.reservationService.findByOwnerWithPaginationAndStatus(
        ownerId,
        page,
        limit,
        status,
      );
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to fetch reservations by owner',
        cause: error?.message,
      });
    }
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'List reservations by userId with pagination and status filter',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Reservation status',
    example: 'approved',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of reservations',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  async findByUserWithPagination(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
  ): Promise<{ data: Reservation[]; total: number }> {
    try {
      return await this.reservationService.findByUserWithPaginationAndStatus(
        userId,
        page,
        limit,
        status,
      );
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to fetch reservations by user',
        cause: error?.message,
      });
    }
  }

  @Post(':id/approve-cancellation')
  @ApiOperation({ summary: 'Approve cancellation of a reservation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reservation cancellation approved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  async approveCancellation(@Param('id') id: string): Promise<Reservation> {
    return this.reservationService.approveCancellation(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Request cancellation of a reservation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cancellation request submitted successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  async cancelReservation(@Param('id') id: string): Promise<Reservation> {
    return this.reservationService.cancellingReservaition(id);
  }
}
