import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CryptoService } from '../common/crypto/crypto.service';
import { UnauthorizedException } from '@nestjs/common';
import { CreateUserDTOInput } from '../users/dtos/create-user.dto';
import { UserType } from '../../../src/schema/user.schema';

describe('AuthService', () => {
  let service: AuthService;
  let usersServiceMock: any;
  let jwtServiceMock: any;
  let cryptoServiceMock: any;

  beforeEach(async () => {
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
      jwtServiceMock.sign.mockReturnValue('access_token');

      const result = await service.register(userData);

      expect(result).toEqual({ accessToken: 'access_token' });
      expect(cryptoServiceMock.encryptPassword).toHaveBeenCalledWith(
        userData.password,
      );
      expect(usersServiceMock.createUser).toHaveBeenCalledWith({
        ...userData,
        password: hashedPassword,
      });
      expect(jwtServiceMock.sign).toHaveBeenCalledWith({ id: newUser.id });
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
      jwtServiceMock.sign.mockReturnValue('access_token');

      const result = await service.login(user);

      expect(result).toEqual({ accessToken: 'access_token' });
      expect(jwtServiceMock.sign).toHaveBeenCalledWith({
        email: user.email,
        sub: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
      });
    });
  });
});
