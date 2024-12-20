import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CryptoService } from '../common/crypto/crypto.service';
import { UnauthorizedException } from '@nestjs/common';
import { CreateUserDTOInput } from '../users/dtos/create-user.dto';
import { UserType } from '../../../src/schema/user.schema';
import { jwtConfig } from './config/jwt.config';

describe('AuthService', () => {
  let service: AuthService;
  let usersServiceMock: any;
  let jwtServiceMock: any;
  let cryptoServiceMock: any;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: CryptoService, useValue: cryptoServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user and return an access token', async () => {
      const userData: CreateUserDTOInput = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
        phone: '1199999999',
        userType: UserType.HOUSE_OWNER,
      };

      const hashedPassword = 'hashedPassword';
      const newUser = { id: '1', ...userData };

      cryptoServiceMock.encryptPassword.mockReturnValue(hashedPassword);
      usersServiceMock.createUser.mockResolvedValue(newUser);
      const accessToken = 'access_token';

      jwtServiceMock.sign.mockReturnValueOnce(accessToken);

      const result = await service.register(userData);
      expect(result).toEqual({ accessToken });
      expect(cryptoServiceMock.encryptPassword).toHaveBeenCalledWith(
        userData.password,
      );
      expect(usersServiceMock.createUser).toHaveBeenCalledWith({
        ...userData,
        password: hashedPassword,
      });
      const payload = {
        email: userData.email,
        sub: '1',
        firstName: userData.firstName,
        lastName: userData.lastName,
        userType: userData.userType,
      };
      expect(jwtServiceMock.sign).toHaveBeenCalledWith(payload);
    });
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
      ).rejects.toThrow(UnauthorizedException);
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
        UnauthorizedException,
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
