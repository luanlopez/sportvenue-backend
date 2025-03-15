import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserType } from '../../../src/schema/user.schema';
import { PreRegisterDTO } from './dtos/pre-register.dto';
import { ConfigService } from '@nestjs/config';
import { LokiLoggerService } from 'src/common/logger/loki-logger.service';
import { DecryptInterceptor } from '../../common/interceptors/decrypt.interceptor';

describe('AuthController', () => {
  let controller: AuthController;
  let authServiceMock: any;
  let configServiceMock: any;
  let loggerServiceMock: any;

  beforeEach(async () => {
    configServiceMock = {
      get: jest.fn((key: string) => {
        if (key === 'CRYPTO_SECRET_KEY') {
          return 'test-secret-key';
        }
        return null;
      }),
    };

    loggerServiceMock = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

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
        { provide: ConfigService, useValue: configServiceMock },
        { provide: LokiLoggerService, useValue: loggerServiceMock },
        DecryptInterceptor,
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
        planID: '1',
      };

      authServiceMock.preRegister.mockResolvedValue({
        message: 'Código de verificação enviado para o email',
      });

      const result = await controller.preRegister(userData);

      expect(result).toEqual({
        message: 'Código de verificação enviado para o email',
      });
      expect(authServiceMock.preRegister).toHaveBeenCalledWith(userData);
      expect(loggerServiceMock.info).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return JWT token when valid credentials are provided', async () => {
      const loginData = {
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const user = {
        id: '1',
        email: loginData.email,
        firstName: 'John',
        lastName: 'Doe',
        userType: UserType.HOUSE_OWNER,
      };

      const mockToken = {
        accessToken: 'mock_token',
        refreshToken: 'mock_refresh_token',
      };

      authServiceMock.validateUser.mockResolvedValue(user);
      authServiceMock.login.mockResolvedValue(mockToken);

      const result = await controller.login(loginData);

      expect(result).toEqual(mockToken);
      expect(authServiceMock.validateUser).toHaveBeenCalledWith(
        loginData.email,
        loginData.password,
      );
      expect(authServiceMock.login).toHaveBeenCalledWith(user);
      expect(loggerServiceMock.info).toHaveBeenCalled();
    });
  });
});
