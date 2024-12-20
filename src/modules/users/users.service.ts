import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schema/user.schema';
import {
  CreateUserDTOInput,
  CreateUserDTOOutput,
} from './dtos/create-user.dto';
import { CryptoService } from '../common/crypto/crypto.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly cryptoCommon: CryptoService,
    @InjectModel('User') private readonly userModel: Model<User>,
  ) {}

  async getAllUsers(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async createUser(userData: CreateUserDTOInput): Promise<CreateUserDTOOutput> {
    const hashedPassword = await this.cryptoCommon.encryptPassword(
      userData.password,
    );

    const data: Partial<User> = {
      lastName: userData?.lastName,
      firstName: userData?.firstName,
      email: userData?.email,
      userType: userData?.userType,
      password: hashedPassword,
      phone: userData?.phone,
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
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}
