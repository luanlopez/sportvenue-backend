import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubscriptionPlanDocument } from '../../schema/subscription-plan.schema';
import { CourtService } from '../court/court.service';
import { CustomApiError } from 'src/common/errors/custom-api.error';
import { UsersService } from '../users/users.service';
import { ApiMessages } from 'src/common/messages/api-messages';
import { ErrorCodes } from 'src/common/errors/error-codes';
import { CreateSubscriptionPlanDTO } from './dtos/create-subscription-plan.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel('SubscriptionPlan')
    private planModel: Model<SubscriptionPlanDocument>,
    @Inject(forwardRef(() => CourtService))
    private courtService: CourtService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  async canAddCourt(userId: string): Promise<boolean> {
    const user = await this.usersService.getUserById(userId);

    if (!user.subscriptionId) {
      throw new CustomApiError(
        ApiMessages.Subscription.NoPlan.title,
        ApiMessages.Subscription.NoPlan.message,
        ErrorCodes.NO_SUBSCRIPTION_PLAN,
        403,
      );
    }

    const userPlan = await this.planModel.findById(user.subscriptionId);
    if (!userPlan) {
      throw new CustomApiError(
        ApiMessages.Subscription.PlanNotFound.title,
        ApiMessages.Subscription.PlanNotFound.message,
        ErrorCodes.SUBSCRIPTION_PLAN_NOT_FOUND,
        404,
      );
    }

    const userCourts = await this.courtService.countCourtsByOwner(userId);
    return userCourts < userPlan.courtLimit;
  }

  async validateCourtCreation(userId: string) {
    const canAdd = await this.canAddCourt(userId);
    if (!canAdd) {
      throw new CustomApiError(
        ApiMessages.Subscription.CourtLimitExceeded.title,
        ApiMessages.Subscription.CourtLimitExceeded.message,
        ErrorCodes.COURT_LIMIT_EXCEEDED,
        403,
      );
    }
  }

  async createPlan(createPlanDto: CreateSubscriptionPlanDTO) {
    try {
      const plan = await this.planModel.create(createPlanDto);
      return plan;
    } catch (error) {
      throw new CustomApiError(
        ApiMessages.Subscription.InternalError.title,
        ApiMessages.Subscription.InternalError.message,
        ErrorCodes.SUBSCRIPTION_PLAN_CREATION_FAILED,
        500,
      );
    }
  }

  async listPlans() {
    return this.planModel.find({ isActive: true }).sort({ price: 1 });
  }

  async getPlanById(id: string) {
    const plan = await this.planModel.findById(id);
    if (!plan) {
      throw new CustomApiError(
        ApiMessages.Subscription.PlanNotFound.title,
        ApiMessages.Subscription.PlanNotFound.message,
        ErrorCodes.SUBSCRIPTION_PLAN_NOT_FOUND,
        404,
      );
    }
    return plan;
  }

  async updatePlan(id: string, updatePlanDto: CreateSubscriptionPlanDTO) {
    const plan = await this.planModel.findByIdAndUpdate(id, updatePlanDto, {
      new: true,
    });
    if (!plan) {
      throw new CustomApiError(
        ApiMessages.Subscription.PlanNotFound.title,
        ApiMessages.Subscription.PlanNotFound.message,
        ErrorCodes.SUBSCRIPTION_PLAN_NOT_FOUND,
        404,
      );
    }
    return plan;
  }

  async deactivatePlan(id: string) {
    const plan = await this.planModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );
    if (!plan) {
      throw new CustomApiError(
        ApiMessages.Subscription.PlanNotFound.title,
        ApiMessages.Subscription.PlanNotFound.message,
        ErrorCodes.SUBSCRIPTION_PLAN_NOT_FOUND,
        404,
      );
    }
    return plan;
  }
}
