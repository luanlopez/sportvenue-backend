import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CryptoService } from '../common/crypto/crypto.service';
import { jwtConfig } from './config/jwt.config';
import { UserProfileDto } from './dtos/user-profile.dto';
import { PreRegisterDTO } from './dtos/pre-register.dto';
import { VerifyRegistrationDTO } from './dtos/verify-registration.dto';
import { Model } from 'mongoose';
import { ResendService } from '../common/resend/resend.service';
import { InjectModel } from '@nestjs/mongoose';
import { VerificationCode } from 'src/schema/verification-code.schema';
import { UserType } from 'src/schema/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly cryptoService: CryptoService,
    private readonly resendService: ResendService,
    @InjectModel('VerificationCode')
    private readonly verificationModel: Model<VerificationCode>,
  ) {}

  async preRegister(
    preRegisterDto: PreRegisterDTO,
  ): Promise<{ message: string }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    const verificationCode = new this.verificationModel({
      email: preRegisterDto.email,
      code,
      expiresAt,
      userData: {
        firstName: preRegisterDto.firstName,
        lastName: preRegisterDto.lastName,
        userType: preRegisterDto.userType,
        phone: preRegisterDto.phone,
        password: preRegisterDto.password,
      },
    });

    await verificationCode.save();

    await this.resendService.sendEmail(
      preRegisterDto.email,
      'Complete seu cadastro',
      preRegisterDto.firstName,
      code,
    );

    return { message: 'Verification code sent to email' };
  }

  async completeRegistration(
    verifyDto: VerifyRegistrationDTO,
  ): Promise<{ accessToken: string }> {
    const verification = await this.verificationModel.findOne({
      code: verifyDto.code,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!verification) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const hashedPassword = this.cryptoService.encryptPassword(
      verification?.userData?.password,
    );

    const newUser = await this.usersService.createUser({
      email: verification.email,
      password: hashedPassword,
      phone: verification.userData.phone,
      firstName: verification.userData.firstName,
      lastName: verification.userData.lastName,
      userType: verification.userData.userType as UserType,
    });

    verification.isUsed = true;
    await verification.save();

    const token = this.jwtService.sign({
      email: newUser.email,
      sub: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      userType: newUser.userType,
    });

    return { accessToken: token };
  }

  async me(user: any): Promise<UserProfileDto> {
    const userFinded = await this.usersService.getUserById(user.id);

    return {
      id: userFinded.id,
      email: userFinded.email,
      name: userFinded.firstName + ' ' + userFinded.lastName,
      userType: userFinded.userType,
      phone: userFinded.phone,
      created_at: userFinded.createdAt,
      updated_at: userFinded.updatedAt,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService
      .getAllUsers()
      .then((users) => users.find((user) => user.email === email));

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const decryptedPassword = this.cryptoService.decryptPassword(
      user?.password,
    );

    if (decryptedPassword !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(
    user: any,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      email: user.email,
      sub: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtConfig.jwtSecret,
      expiresIn: jwtConfig.accessTokenExpiration,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtConfig.jwtSecret,
      expiresIn: jwtConfig.refreshTokenExpiration,
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: jwtConfig.jwtSecret,
      });

      const user = await this.usersService.getUserById(decoded.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens({
        email: user.email,
        sub: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(payload: any): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = this.jwtService.sign(payload, {
      secret: jwtConfig.jwtSecret,
      expiresIn: jwtConfig.accessTokenExpiration,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtConfig.jwtSecret,
      expiresIn: jwtConfig.refreshTokenExpiration,
    });

    return { accessToken, refreshToken };
  }
}
