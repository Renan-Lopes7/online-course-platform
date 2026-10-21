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
import { Request } from 'supertest';

interface AuthenticateRequest extends Request {
  user: { sub: number };
}
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
  findAll(
    @Req() req: AuthenticateRequest,
    @Param('cursoId', ParseIntPipe) cursoId: number,
  ) {
    return this.aulaService.findAll(cursoId, req.user.sub);
  }

  @Get('aulas/:id')
  findOne(
    @Req() req: AuthenticateRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.aulaService.findOne(id, req.user.sub);
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
