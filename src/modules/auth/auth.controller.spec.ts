import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { CreateUserDTOInput } from '../users/dtos/create-user.dto';
import { UserType } from '../../../src/schema/user.schema';

describe('AuthController', () => {
  let controller: AuthController;
  let authServiceMock: any;

  beforeEach(async () => {
    authServiceMock = {
      register: jest.fn(),
      validateUser: jest.fn(),
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user and return access token', async () => {
      const userData: CreateUserDTOInput = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
        phone: '1199999999',
        userType: UserType.HOUSE_OWNER,
      };

      const mockToken = { accessToken: 'mock_token' };

      authServiceMock.register.mockResolvedValue(mockToken);

      const result = await controller.register(userData);

      expect(result).toEqual(mockToken);
      expect(authServiceMock.register).toHaveBeenCalledWith(userData);
    });
  });

  describe('login', () => {
    it('should return JWT token when valid credentials are provided', async () => {
      const email = 'john.doe@example.com';
      const password = 'password123';
      const user = { id: '1', email, firstName: 'John', lastName: 'Doe' };
      const mockToken = { accessToken: 'mock_token' };

      authServiceMock.validateUser.mockResolvedValue(user);
      authServiceMock.login.mockResolvedValue(mockToken);

      const result = await controller.login({ email, password });

      expect(result).toEqual(mockToken);
      expect(authServiceMock.validateUser).toHaveBeenCalledWith(
        email,
        password,
      );
      expect(authServiceMock.login).toHaveBeenCalledWith(user);
    });

    it('should throw UnauthorizedException when invalid credentials are provided', async () => {
      const email = 'john.doe@example.com';
      const password = 'wrongpassword';

      authServiceMock.validateUser.mockResolvedValue(null);

      await expect(controller.login({ email, password })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
