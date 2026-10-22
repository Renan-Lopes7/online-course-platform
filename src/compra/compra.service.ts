import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/database.service';

@Injectable()
export class CompraService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(userId: number, cursoId: number) {
    const curso = await this.prismaService.curso.findUnique({
      where: { id: cursoId },
    });
    if (!curso) throw new NotFoundException('Este curso não existe');

    return this.prismaService.compra.create({
      data: {
        userId,
        cursoId,
      },
    });
  }

  findAll(userId: number) {
    return this.prismaService.compra.findMany({ where: { userId } });
  }

  findOne(id: number, userId: number) {
    return this.prismaService.compra.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  remove(id: number, userId: number) {
    return this.prismaService.compra.deleteMany({
      where: {
        id,
        userId,
        status: 'PENDENTE',
      },
    });
  }
}
