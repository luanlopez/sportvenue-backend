import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCourtDTO } from './dtos/create-court.dto';
import { Court } from 'src/schema/court.schema';
import { ImageKitService } from '../common/imagekit/imagekit.service';
import { ClerkService } from '../common/clerk/clerk.service';
import { CourtDTO, GetCourtsResponseDTO } from './dtos/list-courts.dto';
import { GetCourtDTO } from './dtos/get-court.dto';

@Injectable()
export class CourtService {
  constructor(
    @InjectModel('Court') private readonly courtModel: Model<Court>,
    private readonly imageKitService: ImageKitService,
    private readonly clerkService: ClerkService,
  ) {}

  async create(data: CreateCourtDTO): Promise<Court> {
    try {
      const createdCourtData = new this.courtModel({
        ...data,
        status: true,
      });

      return createdCourtData.save();
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
      const uploadResponses = await this.imageKitService.uploadFiles(images);
      await this.courtModel.findByIdAndUpdate(courtId, {
        $set: { images: uploadResponses.map((res) => res.url) },
      });
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to upload images',
        cause: error?.message,
      });
    }
  }

  async getCourtByID(courtId: string): Promise<GetCourtDTO> {
    try {
      const court = await this.courtModel.findById(courtId).exec();
      if (!court) {
        throw new InternalServerErrorException('Court not found');
      }

      const userDetails = await this.clerkService.getUserDetails(
        court.owner_id,
      );

      const courtsWithUserDetails: GetCourtDTO = {
        _id: court._id.toString(),
        address: court.address,
        neighborhood: court.neighborhood,
        city: court.city,
        number: court.number,
        owner_id: court.owner_id,
        name: court.name,
        availableHours: court.availableHours,
        images: court.images,
        status: court.status,
        createdAt: court.createdAt.toISOString(),
        updatedAt: court.updatedAt.toISOString(),
        __v: court.__v,
        user: {
          name: `${userDetails?.first_name} ${userDetails?.last_name}`,
          email: userDetails?.email_addresses[0]?.email_address,
          phone: userDetails?.phone_numbers[0]?.phone_number,
        },
      };

      return courtsWithUserDetails;
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to get court with image details',
        cause: error?.message,
      });
    }
  }

  async getCourtsByOwnerWithPagination(
    id: string,
    page: number = 1,
    limit: number = 10,
    name?: string,
    address?: string,
  ): Promise<GetCourtsResponseDTO> {
    try {
      const query: any = { owner_id: id };
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

      const courtsWithUserDetails: CourtDTO[] = await Promise.all(
        courts.map(async (court) => {
          const userDetails = await this.clerkService.getUserDetails(
            court.owner_id,
          );

          return {
            _id: court._id.toString(),
            address: court.address,
            neighborhood: court.neighborhood,
            city: court.city,
            number: court.number,
            owner_id: court.owner_id,
            name: court.name,
            availableHours: court.availableHours,
            images: court.images,
            status: court.status,
            createdAt: court.createdAt.toISOString(),
            updatedAt: court.updatedAt.toISOString(),
            __v: court.__v,
            user: {
              name: `${userDetails?.first_name} ${userDetails?.last_name}`,
              email: userDetails?.email_addresses[0]?.email_address,
              phone: userDetails?.phone_numbers[0]?.phone_number,
            },
          };
        }),
      );

      return { data: courtsWithUserDetails, total };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to get courts with pagination',
        cause: error?.message,
      });
    }
  }

  async getCourtsWithPagination(
    page: number = 1,
    limit: number = 10,
    name?: string,
    address?: string,
  ): Promise<GetCourtsResponseDTO> {
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

      const courtsWithUserDetails: CourtDTO[] = await Promise.all(
        courts.map(async (court) => {
          const userDetails = await this.clerkService.getUserDetails(
            court.owner_id,
          );

          return {
            _id: court._id.toString(),
            address: court.address,
            neighborhood: court.neighborhood,
            city: court.city,
            number: court.number,
            owner_id: court.owner_id,
            name: court.name,
            availableHours: court.availableHours,
            images: court.images,
            status: court.status,
            createdAt: court.createdAt.toISOString(),
            updatedAt: court.updatedAt.toISOString(),
            __v: court.__v,
            user: {
              name: `${userDetails?.first_name} ${userDetails?.last_name}`,
              email: userDetails?.email_addresses[0]?.email_address,
              phone: userDetails?.phone_numbers[0]?.phone_number,
            },
          };
        }),
      );

      return {
        data: courtsWithUserDetails,
        total,
      };
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
