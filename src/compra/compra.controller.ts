import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CompraService } from './compra.service';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';

interface AuthenticateRequest extends Request {
  user: { sub: number };
}

@Controller('compra')
@UseGuards(AuthGuard)
export class CompraController {
  constructor(private readonly compraService: CompraService) {}

  @Post(':cursoId')
  create(
    @Req() req: AuthenticateRequest,
    @Param('cursoId', ParseIntPipe) cursoId: number,
  ) {
    return this.compraService.create(req.user.sub, cursoId);
  }

  @Get()
  findAll(@Req() req: AuthenticateRequest) {
    return this.compraService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(
    @Req() req: AuthenticateRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.compraService.findOne(id, req.user.sub);
  }

  @Delete(':id')
  remove(
    @Req() req: AuthenticateRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.compraService.remove(id, req.user.sub);
  }
}
