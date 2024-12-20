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
  UseGuards,
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserInterface } from '../auth/strategies/interfaces/user.interface';
import { User } from '../auth/user.decorator';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER', 'USER')
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
    @User() user: UserInterface,
  ) {
    try {
      const reservation = await this.reservationService.create(
        user,
        createReservationDto,
      );

      return reservation;
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to create reservation',
        cause: error?.message,
      });
    }
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({ summary: 'Approve a reservation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reservation approved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  async approve(@Param('id') id: string): Promise<Partial<Reservation>> {
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({ summary: 'Reject a reservation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reservation rejected successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  async reject(@Param('id') id: string): Promise<Partial<Reservation>> {
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

  @Get('owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
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
    @User() user: UserInterface,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
  ): Promise<{ data: Partial<Reservation>[]; total: number }> {
    try {
      return await this.reservationService.findByOwnerWithPaginationAndStatus(
        user,
        { page, limit, status },
      );
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to fetch reservations by owner',
        cause: error?.message,
      });
    }
  }

  @Get('user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER')
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
    @User() user: UserInterface,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
  ): Promise<{ data: Partial<Reservation>[]; total: number }> {
    try {
      return await this.reservationService.findByUserWithPaginationAndStatus(
        user,
        { page, limit, status },
      );
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to fetch reservations by user',
        cause: error?.message,
      });
    }
  }

  @Post(':id/approve-cancellation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({ summary: 'Approve cancellation of a reservation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reservation cancellation approved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  async approveCancellation(
    @Param('id') id: string,
  ): Promise<Partial<Reservation>> {
    return this.reservationService.approveCancellation(id);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({ summary: 'Request cancellation of a reservation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cancellation request submitted successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  async cancelReservation(
    @Param('id') id: string,
  ): Promise<Partial<Reservation>> {
    return this.reservationService.cancellingReservaition(id);
  }
}
