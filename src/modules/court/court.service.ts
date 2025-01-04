import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { CreateCourtDTO } from './dtos/create-court.dto';
import { Court } from '../../../src/schema/court.schema';
import { ImageKitService } from '../common/imagekit/imagekit.service';
import { UserInterface } from '../auth/strategies/interfaces/user.interface';
import { GetCourtDTO } from './dtos/get-court.dto';
import { CourtDTO, GetCourtsResponseDTO } from './dtos/list-courts.dto';
import { CourtCategories } from './enums/court-categories.enum';

@Injectable()
export class CourtService {
  constructor(
    @InjectModel('Court') private readonly courtModel: Model<Court>,
    private readonly imageKitService: ImageKitService,
  ) {}

  async create(
    user: UserInterface,
    data: CreateCourtDTO,
  ): Promise<Partial<Court>> {
    try {
      const createdCourtData = new this.courtModel({
        ...data,
        ownerId: user?.id,
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
      const newImageUrls = uploadResponses.map((res) => res.url);

      await this.courtModel.findByIdAndUpdate(
        courtId,
        {
          $push: { images: { $each: newImageUrls } },
        },
        { new: true },
      );
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to upload images',
        cause: error?.message,
      });
    }
  }

  async getCourtByID(courtId: string): Promise<GetCourtDTO> {
    try {
      const court = await this.courtModel
        .findById(courtId)
        .populate('ownerId', 'firstName lastName email phone')
        .lean()
        .exec();

      if (!court) {
        throw new InternalServerErrorException('Court not found');
      }

      const userDetails: any = court?.ownerId;

      const courtsWithUserDetails: GetCourtDTO = {
        _id: court._id.toString(),
        address: court.address,
        neighborhood: court.neighborhood,
        city: court.city,
        number: court.number,
        owner_id: String(userDetails._id),
        name: court.name,
        availableHours: court.availableHours,
        images: court.images,
        status: court.status,
        createdAt: court.createdAt.toISOString(),
        updatedAt: court.updatedAt.toISOString(),
        amenities: court.amenities,
        categories: court.categories,
        price_per_hour: court.price_per_hour,
        __v: court.__v,
        user: {
          name: `${userDetails?.firstName} ${userDetails?.lastName ? userDetails?.lastName : ''}`,
          email: userDetails?.email,
          phone: userDetails?.phone,
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
    search?: string,
    sport?: CourtCategories,
  ): Promise<GetCourtsResponseDTO> {
    try {
      const query: any = { ownerId: id };

      if (search) {
        query.$or = [
          { name: new RegExp(search, 'i') },
          { address: new RegExp(search, 'i') },
          { neighborhood: new RegExp(search, 'i') },
        ];
      }

      if (sport) {
        query.categories = { $in: [sport] };
      }

      const total = await this.courtModel.countDocuments(query).exec();

      const courts = await this.courtModel
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('ownerId', 'firstName lastName email phone')
        .exec();

      const courtsWithUserDetails: CourtDTO[] = courts.map((court) => {
        const userDetails: any = court.ownerId;

        return {
          _id: court._id.toString(),
          address: court.address,
          neighborhood: court.neighborhood,
          city: court.city,
          number: court.number,
          owner_id: String(userDetails._id),
          name: court.name,
          availableHours: court.availableHours,
          images: court.images,
          status: court.status,
          createdAt: court.createdAt.toISOString(),
          updatedAt: court.updatedAt.toISOString(),
          __v: court.__v,
          user: {
            name: `${userDetails?.firstName} ${userDetails?.lastName ? userDetails?.lastName : ''}`,
            email: userDetails?.email,
            phone: userDetails?.phone,
          },
        };
      });

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

  async getCourtsWithPagination(
    page: number = 1,
    limit: number = 10,
    search?: string,
    sport?: CourtCategories,
  ): Promise<GetCourtsResponseDTO> {
    try {
      const query: any = {};

      if (search) {
        query.$or = [
          { name: new RegExp(search, 'i') },
          { address: new RegExp(search, 'i') },
          { neighborhood: new RegExp(search, 'i') },
        ];
      }

      if (sport) {
        query.categories = { $in: [sport] };
      }

      const total = await this.courtModel.countDocuments(query).exec();

      const courts = await this.courtModel
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('ownerId', 'firstName lastName email phone')
        .exec();

      const courtsWithUserDetails: GetCourtDTO[] = courts.map((court) => {
        const userDetails: any = court.ownerId;

        return {
          _id: court._id.toString(),
          address: court.address,
          neighborhood: court.neighborhood,
          city: court.city,
          number: court.number,
          owner_id: String(userDetails._id),
          name: court.name,
          availableHours: court.availableHours,
          images: court.images,
          status: court.status,
          createdAt: court.createdAt.toISOString(),
          updatedAt: court.updatedAt.toISOString(),
          amenities: court.amenities,
          categories: court.categories,
          price_per_hour: court.price_per_hour,
          __v: court.__v,
          user: {
            name: `${userDetails?.firstName} ${userDetails?.lastName ? userDetails?.lastName : ''}`,
            email: userDetails?.email,
            phone: userDetails?.phone,
          },
        };
      });

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

  async deactivateCourt(courtId: string): Promise<Partial<Court>> {
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

  async activateCourt(courtId: string): Promise<Partial<Court>> {
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

  async removeAvailableHour(courtId: ObjectId, hour: string): Promise<Court> {
    try {
      const updatedCourt = await this.courtModel
        .findByIdAndUpdate(
          courtId,
          { $pull: { availableHours: hour } },
          { new: true },
        )
        .exec();

      if (!updatedCourt) {
        throw new NotFoundException('Court not found');
      }

      return updatedCourt;
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to approve court hour',
        cause: error?.message,
      });
    }
  }

  async restoreAvailableHour(courtId: ObjectId, hour: string): Promise<Court> {
    try {
      const updatedCourt = await this.courtModel
        .findByIdAndUpdate(
          courtId,
          { $addToSet: { availableHours: hour } },
          { new: true },
        )
        .exec();

      if (!updatedCourt) {
        throw new NotFoundException('Court not found');
      }

      return updatedCourt;
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to cancel court hour',
        cause: error?.message,
      });
    }
  }

  async removeImage(courtId: string, updatedImages: string[]): Promise<Court> {
    try {
      const updatedCourt = await this.courtModel.findByIdAndUpdate(
        courtId,
        {
          $set: { images: updatedImages },
        },
        { new: true },
      );

      if (!updatedCourt) {
        throw new NotFoundException('Court not found');
      }

      return updatedCourt;
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to update images',
        cause: error?.message,
      });
    }
  }
}
