import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CryptoService } from '../common/crypto/crypto.service';
import { CreateUserDTOInput } from '../users/dtos/create-user.dto';
import { jwtConfig } from './config/jwt.config';
import { UserProfileDto } from './dtos/user-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly cryptoService: CryptoService,
  ) {}

  async register(
    userData: CreateUserDTOInput,
  ): Promise<{ accessToken: string }> {
    const hashedPassword = this.cryptoService.encryptPassword(
      userData.password,
    );

    const newUser = await this.usersService.createUser({
      ...userData,
      password: hashedPassword,
    });

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
