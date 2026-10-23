import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAulaDto } from './dto/create-aula.dto';
import { UpdateAulaDto } from './dto/update-aula.dto';
import { PrismaService } from '../database/database.service';

@Injectable()
export class AulaService {
  constructor(private readonly prismaService: PrismaService) {}

  create(cursoId: number, createAulaDto: CreateAulaDto) {
    return this.prismaService.aula.create({
      data: {
        title: createAulaDto.title,
        videoUrl: createAulaDto.videoUrl,
        curso: {
          connect: { id: cursoId },
        },
      },
    });
  }

  async findAll(cursoId: number, userId: number) {
    const compra = await this.prismaService.compra.findFirst({
      where: {
        userId,
        cursoId,
        status: 'PAGO',
      },
    });

    if (!compra) {
      throw new ForbiddenException('Você não tem acesso a este curso');
    }

    const aulas = await this.prismaService.aula.findMany({
      where: { cursoId },
    });

    if (aulas.length === 0) {
      throw new NotFoundException('Essas aulas não existem para esse curso');
    }

    return aulas;
  }

  async findOne(id: number, userId: number) {
    const aula = await this.prismaService.aula.findFirst({ where: { id } });
    if (!aula) throw new NotFoundException('Aula não encontrada');

    const compra = await this.prismaService.compra.findFirst({
      where: {
        userId,
        cursoId: aula.cursoId,
        status: 'PAGO',
      },
    });
    if (!compra) {
      throw new ForbiddenException("'Você não tem acesso a este curso");
    }

    return aula;
  }

  async update(id: number, updateAulaDto: UpdateAulaDto) {
    const aula = await this.prismaService.aula.findUnique({ where: { id } });
    if (!aula) throw new NotFoundException('Aula não encontrada');

    return await this.prismaService.aula.update({
      where: { id },
      data: updateAulaDto,
    });
  }

  async remove(id: number) {
    const aula = await this.prismaService.aula.findUnique({ where: { id } });
    if (!aula) throw new NotFoundException('Aula não encontrada');

    return this.prismaService.aula.delete({
      where: { id },
    });
  }
}
