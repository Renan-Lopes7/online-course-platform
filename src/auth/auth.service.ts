import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { PrismaService } from '../database/database.service';
import brycpt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async sigIn(createAuthDto: CreateAuthDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: createAuthDto.email },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    const passwordMatch = await brycpt.compare(
      createAuthDto.password,
      user.password,
    );
    if (!passwordMatch) throw new UnauthorizedException('Credencias inválidas');
    const paylod = { user: user.id };

    return { access_token: await this.jwtService.signAsync(paylod) };
  }
}
