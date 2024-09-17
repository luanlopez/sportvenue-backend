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
} from '@nestjs/common';
import { CourtService } from './court.service';
import { CreateCourtDTO } from './dtos/create-court.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { GetCourtsResponseDTO } from './dtos/list-courts.dto';
import { GetCourtDTO } from './dtos/get-court.dto';

@ApiTags('Courts')
@Controller('courts')
export class CourtController {
  constructor(private readonly courtService: CourtService) {}

  @Post()
  async create(@Body() createCourtDTO: CreateCourtDTO) {
    return this.courtService.create(createCourtDTO);
  }

  @Post(':id/upload')
  @UseInterceptors(FilesInterceptor('images'))
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
  async getCourtByID(@Param('id') courtId: string): Promise<GetCourtDTO> {
    return await this.courtService.getCourtByID(courtId);
  }

  @Get()
  async getAllCourts(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('name') name?: string,
    @Query('address') address?: string,
  ): Promise<GetCourtsResponseDTO> {
    return this.courtService.getCourtsWithPagination(
      page,
      limit,
      name,
      address,
    );
  }

  @Get('/owner/:id')
  async getAllCourtsByOwnerID(
    @Param('id') courtId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('name') name?: string,
    @Query('address') address?: string,
  ): Promise<GetCourtsResponseDTO> {
    return this.courtService.getCourtsByOwnerWithPagination(
      courtId,
      page,
      limit,
      name,
      address,
    );
  }

  @Put(':id')
  async updateCourt(
    @Param('id') courtId: string,
    @Body() updateCourtDTO: CreateCourtDTO,
  ) {
    return this.courtService.updateCourt(courtId, updateCourtDTO);
  }

  @Delete(':id')
  async deleteCourt(@Param('id') courtId: string) {
    await this.courtService.deleteCourt(courtId);
    return { message: 'Court deleted successfully' };
  }

  @Patch(':id/inactivate')
  async inactivateCourt(@Param('id') courtId: string) {
    return this.courtService.deactivateCourt(courtId);
  }

  @Patch(':id/activate')
  async activateCourt(@Param('id') courtId: string) {
    return this.courtService.activateCourt(courtId);
  }
}
