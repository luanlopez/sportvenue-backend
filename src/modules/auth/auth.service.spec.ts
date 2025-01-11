import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CryptoService } from '../common/crypto/crypto.service';
import { jwtConfig } from './config/jwt.config';
import { ResendService } from '../common/resend/resend.service';
import { getModelToken } from '@nestjs/mongoose';
import { CustomApiError } from 'src/common/errors/custom-api.error';

describe('AuthService', () => {
  let service: AuthService;
  let usersServiceMock: any;
  let jwtServiceMock: any;
  let cryptoServiceMock: any;
  let resendServiceMock: any;

  beforeEach(async () => {
    process.env.ACCESS_TOKEN_EXPIRATION = '15m';
    process.env.REFRESH_TOKEN_EXPIRATION = '7d';
    process.env.ENCRYPTION_KEY = 'random';

    usersServiceMock = {
      createUser: jest.fn(),
      getAllUsers: jest.fn(),
    };

    jwtServiceMock = {
      sign: jest.fn(),
    };

    cryptoServiceMock = {
      encryptPassword: jest.fn(),
      decryptPassword: jest.fn(),
    };

    resendServiceMock = {
      sendEmail: jest.fn(),
      sendReservationNotification: jest.fn(),
      sendReservationStatusNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: CryptoService, useValue: cryptoServiceMock },
        { provide: ResendService, useValue: resendServiceMock },
        { provide: getModelToken('VerificationCode'), useValue: {} },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password';
      const user = {
        email,
        password: 'hashedPassword',
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
      };

      (usersServiceMock.getAllUsers as jest.Mock).mockResolvedValue([user]);
      cryptoServiceMock.decryptPassword.mockReturnValue(password);

      const result = await service.validateUser(email, password);

      expect(result).toEqual(user);
      expect(cryptoServiceMock.decryptPassword).toHaveBeenCalledWith(
        user.password,
      );
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      (usersServiceMock.getAllUsers as jest.Mock).mockResolvedValue([]);

      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow(CustomApiError);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const email = 'test@example.com';
      const password = 'password';
      const user = {
        email,
        password: 'hashedPassword',
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
      };

      (usersServiceMock.getAllUsers as jest.Mock).mockResolvedValue([user]);
      cryptoServiceMock.decryptPassword.mockReturnValue('wrongPassword');

      await expect(service.validateUser(email, password)).rejects.toThrow(
        CustomApiError,
      );
    });
  });

  describe('login', () => {
    it('should return an access token for valid user', async () => {
      const user = {
        email: 'test@example.com',
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'admin',
      };
      jwtServiceMock.sign
        .mockReturnValue('access_token')
        .mockReturnValue('refresh_token');

      const result = await service.login(user);

      expect(result).toEqual({
        accessToken: 'refresh_token',
        refreshToken: 'refresh_token',
      });
      expect(jwtServiceMock.sign).toHaveBeenCalledWith(
        {
          email: user.email,
          sub: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
        },
        {
          secret: undefined,
          expiresIn: jwtConfig.accessTokenExpiration,
        },
      );
    });
  });
});
