import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppwriteService } from '../common/appwrite/appwrite.service';
import { CreateCourtDTO } from './dtos/create-court.dto';
import { Court } from 'src/schema/court.schema';
import { CourtWithImagesDTO } from './dtos/get-court.dto';

@Injectable()
export class CourtService {
  constructor(
    @InjectModel('Court') private readonly courtModel: Model<Court>,
    private readonly appwriteService: AppwriteService,
  ) {}

  async create(data: CreateCourtDTO): Promise<Court> {
    try {
      const createdCourtData = new this.courtModel(data);
      await createdCourtData.save();

      return createdCourtData;
    } catch (error) {
      throw new InternalServerErrorException({
        message: error?.message,
        cause: error?.stack,
      });
    }
  }

  async uploadImages(
    courtId: string,
    images: Express.Multer.File[],
  ): Promise<void> {
    try {
      const uploadResponses = await this.appwriteService.uploadFiles(images);
      console.log('oi', uploadResponses);
      await this.courtModel.findByIdAndUpdate(courtId, {
        $set: { images: uploadResponses.map((res) => res.$id) },
      });

      console.log('Upload responses:', uploadResponses);
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to upload images',
        cause: error?.message,
      });
    }
  }

  async getCourtWithImageDetails(courtId: string): Promise<CourtWithImagesDTO> {
    try {
      const court = await this.courtModel.findById(courtId).exec();

      if (!court) {
        throw new InternalServerErrorException('Court not found');
      }

      if (!court.images || court.images.length === 0) {
        const dataReturn: CourtWithImagesDTO = {
          _id: String(court._id),
          name: court.name,
          address: court.address,
          images: [],
        };
        return dataReturn;
      }

      const imageDetailsPromises = court.images.map((imageId) =>
        this.appwriteService.getFileDetails(imageId),
      );
      const imageDetails = await Promise.all(imageDetailsPromises);

      const dataReturn: CourtWithImagesDTO = {
        _id: String(court._id),
        name: court.name,
        address: court.address,
        images: [],
      };

      return {
        ...dataReturn,
        images: imageDetails,
      };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to get court with image details',
        cause: error?.message,
      });
    }
  }

  async getCourtsWithPagination(
    page: number = 1,
    limit: number = 10,
    name?: string,
    address?: string,
  ): Promise<{ data: CourtWithImagesDTO[]; total: number }> {
    try {
      const query: any = {};
      const filters = { name, address };

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          query[key] = new RegExp(value, 'i');
        }
      });

      const total = await this.courtModel.countDocuments(query).exec();
      const courts = await this.courtModel
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      const courtsWithImagesPromises = courts.map(async (court) => {
        const imageDetailsPromises = court.images.map((imageId) =>
          this.appwriteService.getFileDetails(imageId),
        );
        const imageDetails = await Promise.all(imageDetailsPromises);

        return {
          _id: String(court._id),
          name: court.name,
          address: court.address,
          images: imageDetails,
        };
      });

      const data = await Promise.all(courtsWithImagesPromises);

      return { data, total };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to get courts with pagination',
        cause: error?.message,
      });
    }
  }

  async deleteCourt(courtId: string): Promise<void> {
    try {
      const result = await this.courtModel.findByIdAndDelete(courtId).exec();

      if (!result) {
        throw new NotFoundException('Court not found');
      }
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to delete court',
        cause: error?.message,
      });
    }
  }

  async deactivateCourt(courtId: string): Promise<Court> {
    try {
      const deactivatedCourt = await this.courtModel
        .findByIdAndUpdate(courtId, { status: false }, { new: true })
        .exec();

      if (!deactivatedCourt) {
        throw new NotFoundException('Court not found');
      }

      return deactivatedCourt;
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to deactivate court',
        cause: error?.message,
      });
    }
  }

  async activateCourt(courtId: string): Promise<Court> {
    try {
      const activatedCourt = await this.courtModel
        .findByIdAndUpdate(courtId, { status: true }, { new: true })
        .exec();

      if (!activatedCourt) {
        throw new NotFoundException('Court not found');
      }

      return activatedCourt;
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to deactivate court',
        cause: error?.message,
      });
    }
  }

  async updateCourt(
    courtId: string,
    updateData: Partial<CreateCourtDTO>,
  ): Promise<Court> {
    try {
      const updatedCourt = await this.courtModel
        .findByIdAndUpdate(courtId, updateData, {
          new: true,
          runValidators: true,
        })
        .exec();

      if (!updatedCourt) {
        throw new NotFoundException('Court not found');
      }

      return updatedCourt;
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to update court',
        cause: error?.message,
      });
    }
  }
}
