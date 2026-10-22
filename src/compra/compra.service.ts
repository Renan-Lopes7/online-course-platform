import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/database.service';

@Injectable()
export class CompraService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(userId: number, cursoId: number) {
    const curso = await this.prismaService.curso.findUnique({
      where: { id: cursoId },
    });
    if (!curso) throw new NotFoundException('Este curso não existe');

    const compraExistente = await this.prismaService.compra.findFirst({
      where: {
        userId,
        cursoId,
        status: {
          in: ['PENDENTE', 'PAGO'],
        },
      },
    });

    if (compraExistente?.status === 'PAGO')
      throw new ConflictException('Você já comprou este curso');

    if (compraExistente?.status === 'PENDENTE') return compraExistente;

    return this.prismaService.compra.create({
      data: {
        userId,
        cursoId,
        valor: curso.price,
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

  async remove(id: number, userId: number) {
    const compra = await this.prismaService.compra.findFirst({
      where: { id, userId },
    });
    if (!compra) throw new NotFoundException('Compra não encontrada');

    if (compra.status !== 'PENDENTE')
      throw new ConflictException(
        'Apenas compras pendentes podem ser canceladas',
      );
    return this.prismaService.compra.update({
      where: {
        id,
        userId,
        status: 'PENDENTE',
      },
      data: {
        status: 'CANCELADO',
      },
    });
  }
}
