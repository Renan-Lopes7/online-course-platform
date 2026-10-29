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
import { Request } from 'express';
import { AdminGuard } from '../auth/admin.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { VideasService } from './videas.service';

interface AuthenticateRequest extends Request {
  user: { sub: number };
}
@Controller()
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AulaController {
  constructor(
    private readonly aulaService: AulaService,
    private readonly videasService: VideasService,
  ) {}

  @Post('cursos/:cursoId/aulas')
  @UseGuards(AdminGuard)
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

  @Get('cursos/:cursoId/admin/aulas')
  @UseGuards(AdminGuard)
  adminFindAll(@Param('cursoId', ParseIntPipe) cursoId: number) {
    return this.aulaService.findAllAdmin(cursoId);
  }

  @Get('aulas/:id/admin/aula')
  @UseGuards(AdminGuard)
  adminFindOne(@Param('id', ParseIntPipe) id: number) {
    return this.aulaService.findOneAdmin(id);
  }

  @Post('admin/videas/upload')
  @UseGuards(AdminGuard)
  async criarUpload(@Body() body: { filename: string; size: number }) {
    return this.videasService.criarSessaoUpload(body.filename, body.size);
  }

  @Get('admin/videas/embed/:embedId')
  @UseGuards(AdminGuard)
  async consultarEmbed(@Param('embedId') embedId: string) {
    return this.videasService.criarTokenPlayback(embedId);
  }

  @Get('aulas/:id/playback')
  async obterPlayback(
    @Req() req: AuthenticateRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.aulaService.obterDadosPlayback(id, req.user.sub);
  }

  @Get('admin/aulas/:id/playback')
  @UseGuards(AdminGuard)
  async obterPlaybackAdmin(@Param('id', ParseIntPipe) id: number) {
    const aula = await this.aulaService.findOneAdmin(id);

    return this.aulaService.obterDadosPlaybackAdmin(aula.id);
  }

  @Patch('aulas/:id')
  @UseGuards(AdminGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAulaDto: UpdateAulaDto,
  ) {
    return this.aulaService.update(id, updateAulaDto);
  }

  @Delete('aulas/:id')
  @UseGuards(AdminGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.aulaService.remove(id);
  }
}
