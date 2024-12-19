import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './interfaces/jwt.interface';
import { UserInterface } from './interfaces/user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('ENCRYPTION_KEY') || 'your-default-key',
    });
  }

  async validate(payload: JwtPayload): Promise<UserInterface> {
    return {
      id: payload.sub,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      userType: payload.userType,
    };
  }
}
