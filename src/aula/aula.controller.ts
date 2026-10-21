import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AulaService } from './aula.service';
import { CreateAulaDto } from './dto/create-aula.dto';
import { UpdateAulaDto } from './dto/update-aula.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller()
@UseGuards(AuthGuard)
export class AulaController {
  constructor(private readonly aulaService: AulaService) {}

  @Post('cursos/:cursoId/aulas')
  create(
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Body() createAulaDto: CreateAulaDto,
  ) {
    return this.aulaService.create(cursoId, createAulaDto);
  }

  @Get('cursos/:cursoId/aulas')
  findAll(@Param('cursoId', ParseIntPipe) cursoId: number) {
    return this.aulaService.findAll(cursoId);
  }

  @Get('aulas/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.aulaService.findOne(id);
  }

  @Patch('aulas/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAulaDto: UpdateAulaDto,
  ) {
    return this.aulaService.update(id, updateAulaDto);
  }

  @Delete('aulas/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.aulaService.remove(id);
  }
}
