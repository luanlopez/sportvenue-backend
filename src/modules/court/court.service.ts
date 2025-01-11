import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { CreateCourtDTO } from './dtos/create-court.dto';
import { Court } from '../../../src/schema/court.schema';
import { ImageKitService } from '../common/imagekit/imagekit.service';
import { UserInterface } from '../auth/strategies/interfaces/user.interface';
import { GetCourtDTO } from './dtos/get-court.dto';
import { CourtDTO, GetCourtsResponseDTO } from './dtos/list-courts.dto';
import { CourtCategories } from './enums/court-categories.enum';
import { CustomApiError } from 'src/common/errors/custom-api.error';
import { ApiMessages } from 'src/common/messages/api-messages';
import { ErrorCodes } from 'src/common/errors/error-codes';

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
        throw new CustomApiError(
          ApiMessages.Court.NotFound.title,
          ApiMessages.Court.NotFound.message,
          ErrorCodes.COURT_NOT_FOUND,
          404,
        );
      }

      const userDetails: any = court?.ownerId;

      const courtsWithUserDetails: GetCourtDTO = {
        _id: court._id.toString(),
        address: court.address,
        description: court.description,
        neighborhood: court.neighborhood,
        city: court.city,
        number: court.number,
        owner_id: String(userDetails._id),
        name: court.name,
        weeklySchedule: court.weeklySchedule,
        images: court.images,
        status: court.status,
        createdAt: court.createdAt.toISOString(),
        updatedAt: court.updatedAt.toISOString(),
        amenities: court.amenities,
        categories: court.categories,
        pricePerHour: court.pricePerHour,
        __v: court.__v,
        user: {
          name: `${userDetails?.firstName} ${userDetails?.lastName ? userDetails?.lastName : ''}`,
          email: userDetails?.email,
          phone: userDetails?.phone,
        },
      };

      return courtsWithUserDetails;
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: ApiMessages.Generic.InternalError.message,
        cause: error?.message,
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
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
          description: court.description,
          neighborhood: court.neighborhood,
          city: court.city,
          number: court.number,
          name: court.name,
          weeklySchedule: court.weeklySchedule,
          images: court.images,
          status: court.status,
          pricePerHour: court.pricePerHour,
          amenities: court.amenities,
          categories: court.categories,
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
        message: ApiMessages.Generic.InternalError.message,
        cause: error?.message,
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
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
          description: court.description,
          neighborhood: court.neighborhood,
          city: court.city,
          number: court.number,
          owner_id: String(userDetails._id),
          name: court.name,
          weeklySchedule: court.weeklySchedule,
          images: court.images,
          status: court.status,
          createdAt: court.createdAt.toISOString(),
          updatedAt: court.updatedAt.toISOString(),
          amenities: court.amenities,
          categories: court.categories,
          pricePerHour: court.pricePerHour,
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
        message: ApiMessages.Generic.InternalError.message,
        cause: error?.message,
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async deleteCourt(courtId: string): Promise<void> {
    try {
      const result = await this.courtModel.findByIdAndDelete(courtId).exec();

      if (!result) {
        throw new CustomApiError(
          ApiMessages.Court.NotFound.title,
          ApiMessages.Court.NotFound.message,
          ErrorCodes.COURT_NOT_FOUND,
          404,
        );
      }
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: ApiMessages.Generic.InternalError.message,
        cause: error?.message,
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async deactivateCourt(courtId: string): Promise<Partial<Court>> {
    try {
      const deactivatedCourt = await this.courtModel
        .findByIdAndUpdate(courtId, { status: false }, { new: true })
        .exec();

      if (!deactivatedCourt) {
        throw new CustomApiError(
          ApiMessages.Court.NotFound.title,
          ApiMessages.Court.NotFound.message,
          ErrorCodes.COURT_NOT_FOUND,
          404,
        );
      }

      return deactivatedCourt;
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: ApiMessages.Generic.InternalError.message,
        cause: error?.message,
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async activateCourt(courtId: string): Promise<Partial<Court>> {
    try {
      const activatedCourt = await this.courtModel
        .findByIdAndUpdate(courtId, { status: true }, { new: true })
        .exec();

      if (!activatedCourt) {
        throw new CustomApiError(
          ApiMessages.Court.NotFound.title,
          ApiMessages.Court.NotFound.message,
          ErrorCodes.COURT_NOT_FOUND,
          404,
        );
      }

      return activatedCourt;
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: ApiMessages.Generic.InternalError.message,
        cause: error?.message,
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
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
        throw new CustomApiError(
          ApiMessages.Court.NotFound.title,
          ApiMessages.Court.NotFound.message,
          ErrorCodes.COURT_NOT_FOUND,
          404,
        );
      }

      return updatedCourt;
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: ApiMessages.Generic.InternalError.message,
        cause: error?.message,
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async removeAvailableHour(
    courtId: ObjectId,
    dayOfWeek: string,
    hour: string,
  ): Promise<Court> {
    try {
      const weeklyScheduleField = `weeklySchedule.${dayOfWeek.toLowerCase()}`;

      const updatedCourt = await this.courtModel
        .findByIdAndUpdate(
          courtId,
          { $pull: { [weeklyScheduleField]: hour } },
          { new: true },
        )
        .exec();

      if (!updatedCourt) {
        throw new CustomApiError(
          ApiMessages.Court.NotFound.title,
          ApiMessages.Court.NotFound.message,
          ErrorCodes.COURT_NOT_FOUND,
          404,
        );
      }

      return updatedCourt;
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: ApiMessages.Generic.InternalError.message,
        cause: error?.message,
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async restoreAvailableHour(
    courtId: ObjectId,
    dayOfWeek: string,
    hour: string,
  ): Promise<Court> {
    try {
      const weeklyScheduleField = `weeklySchedule.${dayOfWeek.toLowerCase()}`;
      const updatedCourt = await this.courtModel
        .findByIdAndUpdate(
          courtId,
          { $addToSet: { [weeklyScheduleField]: hour } },
          { new: true },
        )
        .exec();

      if (!updatedCourt) {
        throw new CustomApiError(
          ApiMessages.Court.NotFound.title,
          ApiMessages.Court.NotFound.message,
          ErrorCodes.COURT_NOT_FOUND,
          404,
        );
      }

      return updatedCourt;
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: ApiMessages.Generic.InternalError.message,
        cause: error?.message,
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
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
        throw new CustomApiError(
          ApiMessages.Court.NotFound.title,
          ApiMessages.Court.NotFound.message,
          ErrorCodes.COURT_NOT_FOUND,
          404,
        );
      }

      return updatedCourt;
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: ApiMessages.Generic.InternalError.message,
        cause: error?.message,
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
