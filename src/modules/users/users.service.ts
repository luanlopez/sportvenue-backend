import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schema/user.schema';
import {
  CreateUserDTOInput,
  CreateUserDTOOutput,
} from './dtos/create-user.dto';
import { CryptoService } from '../common/crypto/crypto.service';
import { ApiMessages } from 'src/common/messages/api-messages';
import { ErrorCodes } from 'src/common/errors/error-codes';
import { CustomApiError } from 'src/common/errors/custom-api.error';
import { UserType } from 'src/schema/user.schema';
import { addDays } from 'date-fns';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { UpdateUserProfileDTO } from './dtos/update-user-profile.dto';
import { Logger } from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly cryptoCommon: CryptoService,
    @InjectModel('User') private readonly userModel: Model<User>,
    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async getAllUsers(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new CustomApiError(
        ApiMessages.User.NotFound.title,
        ApiMessages.User.NotFound.message,
        ErrorCodes.USER_NOT_FOUND,
        404,
      );
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    try {
      const user = await this.userModel.findOne({ email }).exec();

      return user;
    } catch (error) {
      throw new CustomApiError(
        ApiMessages.User.NotFound.title,
        ApiMessages.User.NotFound.message,
        ErrorCodes.USER_NOT_FOUND,
        404,
      );
    }
  }

  async getUserByDocument(document: string): Promise<User> {
    try {
      const user = await this.userModel.findOne({ document }).exec();

      return user;
    } catch (error) {
      throw new CustomApiError(
        ApiMessages.User.NotFound.title,
        ApiMessages.User.NotFound.message,
        ErrorCodes.USER_NOT_FOUND,
        404,
      );
    }
  }

  async createUser(userData: CreateUserDTOInput): Promise<CreateUserDTOOutput> {
    const hashedPassword = await this.cryptoCommon.encryptPassword(
      userData.password,
    );

    const data: Partial<User> = {
      lastName: userData?.lastName,
      firstName: userData?.firstName,
      email: userData?.email,
      password: hashedPassword,
      phone: userData?.phone,
      picture: userData?.picture,
      googleId: userData?.googleId,
      document: userData?.document,
    };

    const newUser = await this.userModel.create(data);

    return {
      id: String(newUser?._id),
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      userType: newUser.userType,
    };
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, userData, { new: true, runValidators: true })
      .exec();

    if (!updatedUser) {
      throw new CustomApiError(
        ApiMessages.User.NotFound.title,
        ApiMessages.User.NotFound.message,
        ErrorCodes.USER_NOT_FOUND,
        404,
      );
    }
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new CustomApiError(
        ApiMessages.User.NotFound.title,
        ApiMessages.User.NotFound.message,
        ErrorCodes.USER_NOT_FOUND,
        404,
      );
    }
  }

  async updateUserType(userId: string, userType: UserType): Promise<User> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { userType },
      { new: true },
    );
  }

  async getActiveOwnersForBilling() {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return this.userModel.find({
      userType: UserType.HOUSE_OWNER,
      createdAt: {
        $lte: sevenDaysAgo,
        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      },
      $or: [
        { lastBillingDate: { $exists: false } },
        {
          lastBillingDate: {
            $lt: new Date(today.getFullYear(), today.getMonth(), 1),
          },
        },
      ],
    });
  }

  async getUsersEndingTrial() {
    const today = new Date();
    const startOfDay = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );
    const endOfDay = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate() + 1,
      ),
    );

    this.logger.log(
      `Buscando usuários com trial terminando entre ${startOfDay.toISOString()} e ${endOfDay.toISOString()}`,
    );

    try {
      const users = await this.userModel
        .find({
          userType: UserType.HOUSE_OWNER,
          trialEndsAt: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
          lastBillingDate: null,
          subscriptionId: { $exists: true },
        })
        .lean();

      this.logger.log(
        `Encontrados ${users.length} usuários com trial terminando`,
      );
      users.forEach((user) => {
        this.logger.log(
          `Usuário ${user.email} - Trial termina em: ${user.trialEndsAt}`,
        );
      });

      return users;
    } catch (error) {
      this.logger.error('Erro ao buscar usuários com trial terminando:', error);
      throw new Error('Não foi possível buscar os usuários.');
    }
  }

  async getUsersForRegularBilling() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
      return this.userModel.find({
        userType: UserType.HOUSE_OWNER,
        trialEndsAt: { $lt: today },
        nextBillingDate: {
          $gte: today,
          $lt: addDays(today, 1),
        },
      });
    } catch (error) {
      throw new Error('Não foi possível buscar os usuários.');
    }
  }

  async assignSubscription(userId: string, subscriptionPlanId: string) {
    const plan =
      await this.subscriptionsService.getPlanById(subscriptionPlanId);

    if (!plan.isActive) {
      throw new CustomApiError(
        ApiMessages.Subscription.InvalidPlan.title,
        ApiMessages.Subscription.InvalidPlan.message,
        ErrorCodes.INVALID_SUBSCRIPTION_PLAN,
        400,
      );
    }

    const now = new Date();
    const trialEndsAt = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 7),
    );
    const nextBillingDate = trialEndsAt;

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      {
        subscriptionId: subscriptionPlanId,
        trialEndsAt,
        nextBillingDate,
      },
      {
        new: true,
        upsert: false,
      },
    );

    if (!updatedUser) {
      throw new CustomApiError(
        ApiMessages.User.NotFound.title,
        ApiMessages.User.NotFound.message,
        ErrorCodes.USER_NOT_FOUND,
        404,
      );
    }

    return {
      message: 'Plano atribuído com sucesso',
      plan: {
        name: plan.name,
        type: plan.type,
        courtLimit: plan.courtLimit,
      },
      trialEndsAt: updatedUser.trialEndsAt,
      nextBillingDate: updatedUser.nextBillingDate,
    };
  }

  async updateProfile(userId: string, updateData: UpdateUserProfileDTO) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        phone: updateData.phone,
      },
      { new: true },
    );

    if (!updatedUser) {
      throw new CustomApiError(
        ApiMessages.User.NotFound.title,
        ApiMessages.User.NotFound.message,
        ErrorCodes.USER_NOT_FOUND,
        404,
      );
    }

    return updatedUser;
  }

  async findById(id: string): Promise<User> {
    return this.userModel.findById(id);
  }
}
