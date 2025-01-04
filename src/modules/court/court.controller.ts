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

@ApiTags('Courts')
@Controller('courts')
export class CourtController {
  constructor(private readonly courtService: CourtService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({ summary: 'Create a new court' })
  @ApiResponse({
    status: 201,
    description: 'The court has been successfully created.',
  })
  async create(
    @Body() createCourtDTO: CreateCourtDTO,
    @User() user: UserInterface,
  ) {
    return this.courtService.create(user, createCourtDTO);
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
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    try {
      await this.courtService.uploadImages(courtId, files);
      return { message: 'Images uploaded successfully' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER', 'USER')
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
    return await this.courtService.getCourtByID(courtId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER')
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
    return this.courtService.getCourtsWithPagination(
      page,
      limit,
      search,
      sport,
    );
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
    @Param('id') courtId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('sport') sport?: CourtCategories,
  ): Promise<GetCourtsResponseDTO> {
    return this.courtService.getCourtsByOwnerWithPagination(
      courtId,
      page,
      limit,
      search,
      sport,
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
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
    return this.courtService.updateCourt(courtId, updateCourtDTO);
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
    await this.courtService.deleteCourt(courtId);
    return { message: 'Court deleted successfully' };
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
    return this.courtService.deactivateCourt(courtId);
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
    return this.courtService.activateCourt(courtId);
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
    return this.courtService.removeImage(id, images);
  }
}
