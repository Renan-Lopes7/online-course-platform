import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../database/database.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async signup(createUserDto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prismaService.user.create({
      data: { ...createUserDto, password: passwordHash },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Usuário cadastrado com sucesso.',
      user,
    };
  }

  async update(id: number, updateUserDto: UpdateUserDto, userId: number) {
    if (id !== userId)
      throw new ForbiddenException(
        'Você não pode atualizar os dados de outro usuário',
      );

    const user = await this.prismaService.user.findFirst({
      where: { id },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    const { name, email, password, currentPassword } = updateUserDto;

    if (password) {
      if (!currentPassword) {
        throw new BadRequestException(
          'Digite sua senha atual para mudar de senha',
        );
      }
      const passwordIsValid = await bcrypt.compare(
        currentPassword,
        user?.password,
      );
      if (!passwordIsValid)
        throw new UnauthorizedException('Senha atual incorreta');
    }

    if (email) {
      const emailExist = await this.prismaService.user.findUnique({
        where: { email },
      });

      if (emailExist && emailExist.id !== id) {
        throw new BadRequestException('Este e-mail já está cadastrado.');
      }
    }

    await this.prismaService.user.update({
      where: { id: id },
      data: {
        name,
        email,
        ...(password && { password: await bcrypt.hash(password, 10) }),
      },
    });

    return {
      message: 'Usuário atualizado com sucesso',
    };
  }

  async remove(id: number, userId: number) {
    if (id !== userId)
      throw new ForbiddenException(
        'Você não pode excluir a conta de outro usuário.',
      );
    const findUser = await this.prismaService.user.findFirst({ where: { id } });
    if (!findUser) throw new NotFoundException('Usuário não encontrado.');
    await this.prismaService.user.delete({ where: { id } });
    return {
      message: 'Usuário deletado com sucesso',
    };
  }
}
