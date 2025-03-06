import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/schema/user.schema';
import { CryptoCommon } from '../common/crypto/crypto.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { LokiLoggerModule } from 'src/common/logger/loki-logger.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    CryptoCommon,
    forwardRef(() => SubscriptionsModule),
    LokiLoggerModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
