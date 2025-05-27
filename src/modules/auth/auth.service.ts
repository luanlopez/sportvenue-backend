import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CryptoService } from '../common/crypto/crypto.service';
import { jwtConfig } from './config/jwt.config';
import { UserProfileDto } from './dtos/user-profile.dto';
import { PreRegisterDTO } from './dtos/pre-register.dto';
import { VerifyRegistrationDTO } from './dtos/verify-registration.dto';
import { ForgotPasswordDTO } from './dtos/forgot-password.dto';
import { ResetPasswordDTO } from './dtos/forgot-password.dto';
import { Model } from 'mongoose';
import { ResendService } from '../common/resend/resend.service';
import { InjectModel } from '@nestjs/mongoose';
import { VerificationCode } from 'src/schema/verification-code.schema';
import { UserType } from 'src/schema/user.schema';
import { CustomApiError } from '../../common/errors/custom-api.error';
import { ErrorCodes } from '../../common/errors/error-codes';
import { ApiMessages } from '../../common/messages/api-messages';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly cryptoService: CryptoService,
    private readonly resendService: ResendService,
    private readonly paymentService: PaymentsService,
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

    await this.verificationModel.updateMany(
      {
        email: preRegisterDto.email,
        isUsed: false,
      },
      {
        isUsed: true,
      },
    );

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const verificationCode = new this.verificationModel({
      email: preRegisterDto.email,
      code,
      type: 'REGISTRATION',
      isUsed: false,
      userData: {
        firstName: preRegisterDto.firstName,
        lastName: preRegisterDto.lastName,
        userType: preRegisterDto?.userType,
        planID: preRegisterDto?.planID,
        phone: preRegisterDto.phone,
        password: preRegisterDto.password,
      },
      expiresAt: new Date(new Date().getTime() + 5 * 60 * 1000),
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
    const verification = await this.verificationModel.findOne({
      code: verifyDto.code,
      type: 'REGISTRATION',
      isUsed: false,
    });

    if (!verification) {
      throw new CustomApiError(
        ApiMessages.Auth.InvalidCredentials.title,
        ApiMessages.Auth.InvalidCredentials.message,
        ErrorCodes.INVALID_CREDENTIALS,
        401,
      );
    }

    const expirationTime = new Date(verification.expiresAt);
    expirationTime.setMinutes(expirationTime.getMinutes() + 5);

    if (expirationTime < new Date()) {
      throw new CustomApiError(
        ApiMessages.Auth.TokenExpired.title,
        ApiMessages.Auth.TokenExpired.message,
        ErrorCodes.TOKEN_EXPIRED,
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

    if (verification.userData.planID) {
      await this.usersService.assignSubscription(
        newUser.id,
        verification.userData.planID,
      );
    }

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
      subscriptionPlanId: String(userFinded?.subscriptionId),
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

  async updateUserType(userId: string, userType: UserType, document: string) {
    const user = await this.usersService.getUserByDocument(document);
    if (user) {
      throw new CustomApiError(
        ApiMessages.Auth.DocumentExists.title,
        ApiMessages.Auth.DocumentExists.message,
        ErrorCodes.DOCUMENT_ALREADY_EXISTS,
        401,
      );
    }
    return this.usersService.updateUser(userId, {
      userType,
      document,
    });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDTO): Promise<void> {
    const user = await this.usersService.getUserByEmail(
      forgotPasswordDto.email,
    );

    if (!user) {
      throw new CustomApiError(
        'Usuário não encontrado',
        'Não encontramos um usuário com este email',
        ErrorCodes.USER_NOT_FOUND,
        404,
      );
    }

    const code = Math.random().toString().slice(2, 8);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.verificationModel.create({
      email: user.email,
      code,
      type: 'RESET_PASSWORD',
      expiresAt,
      isUsed: false,
    });

    await this.resendService.sendPasswordResetCode(
      user.email,
      user.firstName,
      code,
    );
  }

  async resetPassword(resetPasswordDto: ResetPasswordDTO): Promise<void> {
    const verification = await this.verificationModel.findOne({
      code: resetPasswordDto.code,
      type: 'RESET_PASSWORD',
      isUsed: false,
    });

    if (!verification) {
      throw new CustomApiError(
        'Código inválido',
        'O código de verificação é inválido ou já foi utilizado',
        ErrorCodes.INVALID_VERIFICATION_CODE,
        400,
      );
    }

    if (verification.expiresAt < new Date()) {
      throw new CustomApiError(
        'Código expirado',
        'O código de verificação expirou',
        ErrorCodes.VERIFICATION_CODE_EXPIRED,
        400,
      );
    }

    const user = await this.usersService.getUserByEmail(verification.email);
    if (!user) {
      throw new CustomApiError(
        'Usuário não encontrado',
        'Não encontramos um usuário com este email',
        ErrorCodes.USER_NOT_FOUND,
        404,
      );
    }
    console.log(user, resetPasswordDto.newPassword);
    const hashedPassword = this.cryptoService.encryptPassword(
      resetPasswordDto.newPassword,
    );

    await this.usersService.updateUser(String(user._id), {
      password: hashedPassword,
    });

    verification.isUsed = true;
    await verification.save();

    await this.resendService.sendPasswordResetConfirmation(
      user.email,
      user.firstName,
    );
  }

  /**
   * Verifica se há faturas pendentes para um usuário específico
   *
   * @param userId ID do usuário a ser verificado
   * @returns true se houver faturas pendentes, false caso contrário
   */
  async checkPendingInvoices(userId: string): Promise<boolean> {
    const hasPendingInvoices =
      await this.paymentService.hasPendingPaymentsForUser(userId);
    return hasPendingInvoices;
  }
}
