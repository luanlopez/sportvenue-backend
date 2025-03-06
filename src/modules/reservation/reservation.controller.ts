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
import { LokiLoggerService } from 'src/common/logger/loki-logger.service';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationController {
  constructor(
    private readonly reservationService: ReservationService,
    private readonly lokiLogger: LokiLoggerService,
  ) {}

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
    await this.lokiLogger.info('Creating new reservation', {
      endpoint: '/reservations',
      method: 'POST',
      userId: user.id,
      body: JSON.stringify(createReservationDto),
    });

    try {
      const reservation = await this.reservationService.create(
        user,
        createReservationDto,
      );

      await this.lokiLogger.info('Reservation created successfully', {
        endpoint: '/reservations',
        method: 'POST',
        userId: user.id,
        reservationId: reservation.id,
      });

      return reservation;
    } catch (error) {
      await this.lokiLogger.error('Failed to create reservation', error, {
        endpoint: '/reservations',
        method: 'POST',
        userId: user.id,
        body: JSON.stringify(createReservationDto),
      });

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
  async approve(@Param('id') id: string, @User() user: UserInterface): Promise<Partial<Reservation>> {
    await this.lokiLogger.info('Approving reservation', {
      endpoint: '/reservations/:id/approve',
      method: 'PATCH',
      userId: user.id,
      reservationId: id,
    });

    try {
      const result = await this.reservationService.updateReservationStatus(
        id,
        'approved',
      );

      await this.lokiLogger.info('Reservation approved successfully', {
        endpoint: '/reservations/:id/approve',
        method: 'PATCH',
        userId: user.id,
        reservationId: id,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to approve reservation', error, {
        endpoint: '/reservations/:id/approve',
        method: 'PATCH',
        userId: user.id,
        reservationId: id,
      });

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
  async reject(@Param('id') id: string, @User() user: UserInterface): Promise<Partial<Reservation>> {
    await this.lokiLogger.info('Rejecting reservation', {
      endpoint: '/reservations/:id/reject',
      method: 'PATCH',
      userId: user.id,
      reservationId: id,
    });

    try {
      const result = await this.reservationService.updateReservationStatus(
        id,
        'rejected',
      );

      await this.lokiLogger.info('Reservation rejected successfully', {
        endpoint: '/reservations/:id/reject',
        method: 'PATCH',
        userId: user.id,
        reservationId: id,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to reject reservation', error, {
        endpoint: '/reservations/:id/reject',
        method: 'PATCH',
        userId: user.id,
        reservationId: id,
      });

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
    await this.lokiLogger.info('Fetching owner reservations', {
      endpoint: '/reservations/owner',
      method: 'GET',
      userId: user.id,
      params: { page, limit, status },
    });

    try {
      const result = await this.reservationService.findByOwnerWithPaginationAndStatus(
        user,
        { page, limit, status },
      );

      await this.lokiLogger.info('Owner reservations fetched successfully', {
        endpoint: '/reservations/owner',
        method: 'GET',
        userId: user.id,
        totalReservations: result.total,
        returnedReservations: result.data.length,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to fetch owner reservations', error, {
        endpoint: '/reservations/owner',
        method: 'GET',
        userId: user.id,
        params: { page, limit, status },
      });

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
    await this.lokiLogger.info('Fetching user reservations', {
      endpoint: '/reservations/user',
      method: 'GET',
      userId: user.id,
      params: { page, limit, status },
    });

    try {
      const result = await this.reservationService.findByUserWithPaginationAndStatus(
        user,
        { page, limit, status },
      );

      await this.lokiLogger.info('User reservations fetched successfully', {
        endpoint: '/reservations/user',
        method: 'GET',
        userId: user.id,
        totalReservations: result.total,
        returnedReservations: result.data.length,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to fetch user reservations', error, {
        endpoint: '/reservations/user',
        method: 'GET',
        userId: user.id,
        params: { page, limit, status },
      });

      throw new InternalServerErrorException({
        message: 'Failed to fetch reservations by user',
        cause: error?.message,
      });
    }
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER')
  @ApiOperation({ summary: 'Request cancellation of a reservation' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Motivo do cancelamento',
        },
      },
    },
  })
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
    @User() user: UserInterface,
    @Body('reason') reason?: string,
  ): Promise<Partial<Reservation>> {
    await this.lokiLogger.info('Cancelling reservation', {
      endpoint: '/reservations/:id/cancel',
      method: 'POST',
      userId: user.id,
      reservationId: id,
      body: JSON.stringify({ reason }),
    });

    try {
      const result = await this.reservationService.cancellingReservaition(id, reason);

      await this.lokiLogger.info('Reservation cancelled successfully', {
        endpoint: '/reservations/:id/cancel',
        method: 'POST',
        userId: user.id,
        reservationId: id,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to cancel reservation', error, {
        endpoint: '/reservations/:id/cancel',
        method: 'POST',
        userId: user.id,
        reservationId: id,
        body: JSON.stringify({ reason }),
      });

      throw new InternalServerErrorException({
        message: 'Failed to cancel reservation',
        cause: error?.message,
      });
    }
  }
}
