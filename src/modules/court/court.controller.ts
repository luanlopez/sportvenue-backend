import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Body,
  BadRequestException,
  Param,
  Get,
  Query,
  Delete,
  Put,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CourtService } from './court.service';
import { CreateCourtDTO } from './dtos/create-court.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetCourtDTO } from './dtos/get-court.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { UserInterface } from '../auth/strategies/interfaces/user.interface';
import { GetCourtsResponseDTO } from './dtos/list-courts.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CourtCategories } from './enums/court-categories.enum';
import { LokiLoggerService } from 'src/common/logger/loki-logger.service';

@ApiTags('Courts')
@Controller('courts')
export class CourtController {
  constructor(
    private readonly courtService: CourtService,
    private readonly lokiLogger: LokiLoggerService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  async create(
    @Body() createCourtDTO: CreateCourtDTO,
    @User() user: UserInterface,
  ) {
    await this.lokiLogger.info('Creating new court', {
      endpoint: '/courts',
      method: 'POST',
      userId: user.id,
      body: JSON.stringify(createCourtDTO),
    });

    try {
      const result = await this.courtService.create(user, createCourtDTO);

      await this.lokiLogger.info('Court created successfully', {
        endpoint: '/courts',
        method: 'POST',
        courtId: result.id,
        userId: user.id,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to create court', error, {
        endpoint: '/courts',
        method: 'POST',
        userId: user.id,
      });
      throw error;
    }
  }

  @Post(':id/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @UseInterceptors(FilesInterceptor('images'))
  @ApiOperation({ summary: 'Upload images for a court' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the court for which images are being uploaded',
  })
  @ApiResponse({
    status: 200,
    description: 'Images uploaded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'No files were provided',
  })
  async uploadImages(
    @Param('id') courtId: string,
    @UploadedFiles() files: any,
  ) {
    await this.lokiLogger.info('Starting image upload', {
      endpoint: '/courts/:id/upload',
      method: 'POST',
      courtId,
      filesCount: files?.length,
    });

    if (!files || files.length === 0) {
      await this.lokiLogger.error('No files provided for upload', null, {
        endpoint: '/courts/:id/upload',
        method: 'POST',
        courtId,
      });
      throw new BadRequestException('No files provided');
    }

    try {
      await this.courtService.uploadImages(courtId, files);
      await this.lokiLogger.info('Images uploaded successfully', {
        endpoint: '/courts/:id/upload',
        method: 'POST',
        courtId,
        filesCount: files.length,
      });

      return { message: 'Images uploaded successfully' };
    } catch (error) {
      await this.lokiLogger.error('Failed to upload images', error, {
        endpoint: '/courts/:id/upload',
        method: 'POST',
        courtId,
      });
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a court by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the court to retrieve',
  })
  @ApiResponse({
    status: 200,
    description: 'Court details fetched successfully',
    type: GetCourtDTO,
  })
  async getCourtByID(@Param('id') courtId: string): Promise<GetCourtDTO> {
    await this.lokiLogger.info('Fetching court by ID', {
      endpoint: '/courts/:id',
      method: 'GET',
      courtId,
    });

    try {
      const court = await this.courtService.getCourtByID(courtId);
      await this.lokiLogger.info('Court fetched successfully', {
        endpoint: '/courts/:id',
        method: 'GET',
        courtId,
      });

      return court;
    } catch (error) {
      await this.lokiLogger.error('Failed to fetch court', error, {
        endpoint: '/courts/:id',
        method: 'GET',
        courtId,
      });
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of all courts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in name, address and neighborhood',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: CourtCategories,
    description: 'Filter courts by category',
  })
  @ApiResponse({
    status: 200,
    description: 'List of courts fetched successfully',
    type: GetCourtsResponseDTO,
  })
  async getAllCourts(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('sport') sport?: CourtCategories,
  ): Promise<GetCourtsResponseDTO> {
    await this.lokiLogger.info('Fetching all courts', {
      endpoint: '/courts',
      method: 'GET',
      params: { page, limit, search, sport },
    });

    try {
      const result = await this.courtService.getCourtsWithPagination(
        page,
        limit,
        search,
        sport,
      );

      await this.lokiLogger.info('Courts fetched successfully', {
        endpoint: '/courts',
        method: 'GET',
        totalCourts: result.total,
        returnedCourts: result.data.length,
      });
      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to fetch courts', error, {
        endpoint: '/courts',
        method: 'GET',
        params: { page, limit, search, sport },
        error: error,
      });
      throw error;
    }
  }

  @Get('/owner/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({ summary: 'Get all courts by owner ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in name, address and neighborhood',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: CourtCategories,
    description: 'Filter courts by category',
  })
  @ApiResponse({
    status: 200,
    description: 'Courts by owner fetched successfully',
    type: GetCourtsResponseDTO,
  })
  async getAllCourtsByOwnerID(
    @Param('id') ownerId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('sport') sport?: CourtCategories,
  ): Promise<GetCourtsResponseDTO> {
    await this.lokiLogger.info('Fetching courts by owner', {
      endpoint: '/courts/owner/:id',
      method: 'GET',
      ownerId,
      params: { page, limit, search, sport },
    });

    try {
      const result = await this.courtService.getCourtsByOwnerWithPagination(
        ownerId,
        page,
        limit,
        search,
        sport,
      );
      await this.lokiLogger.info('Owner courts fetched successfully', {
        endpoint: '/courts/owner/:id',
        method: 'GET',
        ownerId,
        totalCourts: result.total,
        returnedCourts: result.data.length,
      });
      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to fetch owner courts', error, {
        endpoint: '/courts/owner/:id',
        method: 'GET',
        ownerId,
        params: { page, limit, search, sport },
      });
      throw error;
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({ summary: 'Update a court by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the court to update',
  })
  @ApiResponse({
    status: 200,
    description: 'Court updated successfully',
  })
  async updateCourt(
    @Param('id') courtId: string,
    @Body() updateCourtDTO: CreateCourtDTO,
  ) {
    await this.lokiLogger.info('Updating court', {
      endpoint: '/courts/:id',
      method: 'PUT',
      courtId,
      body: JSON.stringify(updateCourtDTO),
    });

    try {
      const result = await this.courtService.updateCourt(
        courtId,
        updateCourtDTO,
      );
      await this.lokiLogger.info('Court updated successfully', {
        endpoint: '/courts/:id',
        method: 'PUT',
        courtId,
      });
      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to update court', error, {
        endpoint: '/courts/:id',
        method: 'PUT',
        courtId,
      });
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({ summary: 'Delete a court by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the court to delete',
  })
  @ApiResponse({
    status: 200,
    description: 'Court deleted successfully',
  })
  async deleteCourt(@Param('id') courtId: string) {
    await this.lokiLogger.info('Deleting court', {
      endpoint: '/courts/:id',
      method: 'DELETE',
      courtId,
    });

    try {
      await this.courtService.deleteCourt(courtId);
      await this.lokiLogger.info('Court deleted successfully', {
        endpoint: '/courts/:id',
        method: 'DELETE',
        courtId,
      });
      return { message: 'Court deleted successfully' };
    } catch (error) {
      await this.lokiLogger.error('Failed to delete court', error, {
        endpoint: '/courts/:id',
        method: 'DELETE',
        courtId,
      });
      throw error;
    }
  }

  @Patch(':id/inactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({ summary: 'Inactivate a court by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the court to inactivate',
  })
  @ApiResponse({
    status: 200,
    description: 'Court inactivated successfully',
  })
  async inactivateCourt(@Param('id') courtId: string) {
    await this.lokiLogger.info('Inactivating court', {
      endpoint: '/courts/:id/inactivate',
      method: 'PATCH',
      courtId,
    });

    try {
      const result = await this.courtService.deactivateCourt(courtId);
      await this.lokiLogger.info('Court inactivated successfully', {
        endpoint: '/courts/:id/inactivate',
        method: 'PATCH',
        courtId,
      });
      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to inactivate court', error, {
        endpoint: '/courts/:id/inactivate',
        method: 'PATCH',
        courtId,
      });
      throw error;
    }
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({ summary: 'Activate a court by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the court to activate',
  })
  @ApiResponse({
    status: 200,
    description: 'Court activated successfully',
  })
  async activateCourt(@Param('id') courtId: string) {
    await this.lokiLogger.info('Activating court', {
      endpoint: '/courts/:id/activate',
      method: 'PATCH',
      courtId,
    });

    try {
      const result = await this.courtService.activateCourt(courtId);
      await this.lokiLogger.info('Court activated successfully', {
        endpoint: '/courts/:id/activate',
        method: 'PATCH',
        courtId,
      });
      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to activate court', error, {
        endpoint: '/courts/:id/activate',
        method: 'PATCH',
        courtId,
      });
      throw error;
    }
  }

  @Delete(':id/images')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Atualiza a lista de imagens da quadra' })
  @ApiParam({ name: 'id', description: 'ID da quadra' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
          },
          example: [
            'https://example.com/image1.jpg',
            'https://example.com/image2.jpg',
          ],
        },
      },
    },
  })
  async removeImage(
    @Param('id') id: string,
    @Body('images') images: string[],
  ): Promise<any> {
    await this.lokiLogger.info('Removing court images', {
      endpoint: '/courts/:id/images',
      method: 'DELETE',
      courtId: id,
      imagesCount: images?.length,
    });

    try {
      const result = await this.courtService.removeImage(id, images);
      await this.lokiLogger.info('Court images removed successfully', {
        endpoint: '/courts/:id/images',
        method: 'DELETE',
        courtId: id,
        imagesCount: images?.length,
      });
      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to remove court images', error, {
        endpoint: '/courts/:id/images',
        method: 'DELETE',
        courtId: id,
      });
      throw error;
    }
  }
}
