import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserType } from '../../../src/schema/user.schema';
import { PreRegisterDTO } from './dtos/pre-register.dto';
import { LokiLoggerService } from 'src/common/logger/loki-logger.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authServiceMock: any;

  beforeEach(async () => {
    authServiceMock = {
      register: jest.fn(),
      validateUser: jest.fn(),
      login: jest.fn(),
      preRegister: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: LokiLoggerService,
          useValue: {
            info: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('preRegister', () => {
    it('should preRegister a new user and return access token', async () => {
      const userData: PreRegisterDTO = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password',
        phone: '1199999999',
        userType: UserType.HOUSE_OWNER,
      };

      authServiceMock.preRegister.mockResolvedValue(undefined);

      const result = await controller.preRegister(userData);

      expect(result).toEqual(undefined);
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
  });
});
