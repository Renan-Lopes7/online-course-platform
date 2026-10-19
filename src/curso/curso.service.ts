import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';
import { PrismaService } from '../database/database.service';

@Injectable()
export class CursoService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createCursoDto: CreateCursoDto) {
    return this.prismaService.curso.create({
      data: createCursoDto,
    });
  }

  findAll() {
    return this.prismaService.curso.findMany();
  }

  async findOne(id: number) {
    const course = await this.prismaService.curso.findFirst({ where: { id } });
    if (!course) throw new NotFoundException('Curso não encontrado');

    return course;
  }

  async update(id: number, updateCursoDto: UpdateCursoDto) {
    const course = await this.prismaService.curso.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Curso não encontrado');

    return await this.prismaService.curso.update({
      where: { id },
      data: updateCursoDto,
    });
  }

  async remove(id: number) {
    const course = await this.prismaService.curso.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Curso não encontrado');

    return this.prismaService.curso.delete({
      where: { id },
    });
  }
}
