import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AsaasService } from './asaas.service';
import { AuthGuard } from '../auth/auth.guard';

interface AutheticateRequest {
  user: { sub: number };
}
@Controller('asaas')
@UseGuards(AuthGuard)
export class AsaasController {
  constructor(private readonly asassService: AsaasService) {}

  @Get(':id')
  testarConexao(@Param('id', ParseIntPipe) userId: number) {
    return this.asassService.garantirClienteAsaas(userId);
  }

  @Post('compra/:compraId/pix')
  criarCobranca(
    @Param('compraId', ParseIntPipe) compraId: number,
    @Req() req: AutheticateRequest,
  ) {
    return this.asassService.criarCobrancaPix(compraId, req.user.sub);
  }
}
