import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CryptoService } from '../common/crypto/crypto.service';
import { CreateUserDTOInput } from '../users/dtos/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly cryptoService: CryptoService,
  ) {}

  async register(
    userData: CreateUserDTOInput,
  ): Promise<{ accessToken: string }> {
    const hashedPassword = this.cryptoService.encryptPassword(
      userData.password,
    );

    const newUser = await this.usersService.createUser({
      ...userData,
      password: hashedPassword,
    });

    const token = this.jwtService.sign({ id: newUser.id });

    return { accessToken: token };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService
      .getAllUsers()
      .then((users) => users.find((user) => user.email === email));

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const decryptedPassword = this.cryptoService.decryptPassword(
      user?.password,
    );

    if (decryptedPassword !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(user: any): Promise<{ accessToken: string }> {
    const payload = {
      email: user.email,
      sub: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
    };
    const token = this.jwtService.sign(payload);

    return { accessToken: token };
  }
}
