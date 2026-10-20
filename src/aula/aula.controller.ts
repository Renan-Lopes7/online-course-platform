import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { AulaService } from './aula.service';
import { CreateAulaDto } from './dto/create-aula.dto';
import { UpdateAulaDto } from './dto/update-aula.dto';

@Controller()
export class AulaController {
  constructor(private readonly aulaService: AulaService) {}

  @Post('cursos/:cursoId/aulas')
  create(
    @Param('cursoId') cursoId: number,
    @Body() createAulaDto: CreateAulaDto,
  ) {
    return this.aulaService.create(cursoId, createAulaDto);
  }

  @Get('cursos/:cursoId/aulas')
  findAll(@Param('cursoId') cursoId: number) {
    return this.aulaService.findAll(cursoId);
  }

  @Get('aulas/:id')
  findOne(@Param('id') id: string) {
    return this.aulaService.findOne(+id);
  }

  @Patch('aulas/:id')
  update(@Param('id') id: string, @Body() updateAulaDto: UpdateAulaDto) {
    return this.aulaService.update(+id, updateAulaDto);
  }

  @Delete('aulas/:id')
  remove(@Param('id') id: string) {
    return this.aulaService.remove(+id);
  }
}
