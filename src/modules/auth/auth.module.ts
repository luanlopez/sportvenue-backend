import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { CryptoCommon } from '../common/crypto/crypto.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { VerificationCodeSchema } from 'src/schema/verification-code.schema';
import { ResendModule } from '../common/resend/resend.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { LokiLoggerModule } from 'src/common/logger/loki-logger.module';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    CryptoCommon,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('ENCRYPTION_KEY') || 'your-default-key',
        signOptions: { expiresIn: '1h' },
      }),
    }),
    MongooseModule.forFeature([
      { name: 'VerificationCode', schema: VerificationCodeSchema },
    ]),
    ResendModule,
    LokiLoggerModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
