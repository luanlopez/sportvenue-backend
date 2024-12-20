import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './modules/common/database/database.module';
import { MulterModule } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { ReservationModule } from './modules/reservation/reservation.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CourtModule } from './modules/court/court.module';

const multerOptions: MulterOptions = {
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
};

@Module({
  imports: [
    MulterModule.register(multerOptions),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),
    CourtModule,
    ReservationModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
