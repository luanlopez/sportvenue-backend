import { Injectable } from '@nestjs/common';
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
import { CustomApiError } from '../../common/errors/custom-api.error';
import { ErrorCodes } from '../../common/errors/error-codes';
import { ApiMessages } from '../../common/messages/api-messages';

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
    const getEmail = await this.usersService.getUserByEmail(
      preRegisterDto.email,
    );

    if (getEmail) {
      throw new CustomApiError(
        ApiMessages.Auth.EmailExists.title,
        ApiMessages.Auth.EmailExists.message,
        ErrorCodes.EMAIL_ALREADY_EXISTS,
        400,
      );
    }

    const getTokensExistents = await this.verificationModel.find({
      email: preRegisterDto.email,
    });

    if (getTokensExistents.length > 0) {
      await this.verificationModel.updateMany(
        { email: preRegisterDto.email },
        { isUsed: true },
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

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

    return { message: 'Código de verificação enviado para o email' };
  }

  async completeRegistration(
    verifyDto: VerifyRegistrationDTO,
  ): Promise<{ accessToken: string }> {
    const currentTime = new Date();

    const verification = await this.verificationModel.findOne({
      code: verifyDto.code,
      isUsed: false,
      expiresAt: { $gt: currentTime },
    });

    if (currentTime > verification?.expiresAt) {
      throw new CustomApiError(
        ApiMessages.Auth.TokenExpired.title,
        ApiMessages.Auth.TokenExpired.message,
        ErrorCodes.TOKEN_EXPIRED,
        401,
      );
    }

    if (!verification) {
      throw new CustomApiError(
        ApiMessages.Auth.InvalidCredentials.title,
        ApiMessages.Auth.InvalidCredentials.message,
        ErrorCodes.INVALID_CREDENTIALS,
        401,
      );
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
      picture: userFinded?.picture,
      googleId: userFinded?.googleId,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService
      .getAllUsers()
      .then((users) => users.find((user) => user.email === email));

    if (!user) {
      throw new CustomApiError(
        ApiMessages.Auth.InvalidCredentials.title,
        ApiMessages.Auth.InvalidCredentials.message,
        ErrorCodes.INVALID_CREDENTIALS,
        401,
      );
    }

    const decryptedPassword = this.cryptoService.decryptPassword(
      user?.password,
    );

    if (decryptedPassword !== password) {
      throw new CustomApiError(
        ApiMessages.Auth.InvalidCredentials.title,
        ApiMessages.Auth.InvalidCredentials.message,
        ErrorCodes.INVALID_CREDENTIALS,
        401,
      );
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
        throw new CustomApiError(
          ApiMessages.Auth.InvalidCredentials.title,
          ApiMessages.Auth.InvalidCredentials.message,
          ErrorCodes.INVALID_CREDENTIALS,
          401,
        );
      }

      return this.generateTokens({
        email: user.email,
        sub: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
      });
    } catch (error) {
      throw new CustomApiError(
        ApiMessages.Auth.InvalidCredentials.title,
        ApiMessages.Auth.InvalidCredentials.message,
        ErrorCodes.INVALID_CREDENTIALS,
        401,
      );
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

  async googleLogin(user: any) {
    if (!user) {
      throw new CustomApiError(
        ApiMessages.Auth.InvalidCredentials.title,
        ApiMessages.Auth.InvalidCredentials.message,
        ErrorCodes.INVALID_CREDENTIALS,
        401,
      );
    }

    const existingUser = await this.usersService.getUserByEmail(user.email);

    if (!existingUser) {
      const newUser = await this.usersService.createUser({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: UserType.USER,
        password: '',
        phone: '',
        picture: user.picture,
        googleId: user.id,
      });

      return this.generateTokens({
        email: newUser.email,
        sub: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        userType: newUser.userType,
      });
    }

    return this.generateTokens({
      email: existingUser.email,
      sub: existingUser.id,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      userType: existingUser.userType,
    });
  }
}
