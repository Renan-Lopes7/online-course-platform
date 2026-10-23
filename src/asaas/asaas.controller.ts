import {
  Body,
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
import { CreatePixDto } from './dto/create-pix.dto';

interface AutheticateRequest {
  user: { sub: number };
}
@Controller('asaas')
@UseGuards(AuthGuard)
export class AsaasController {
  constructor(private readonly asassService: AsaasService) {}

  @Post('compra/:compraId/pix')
  criarCobranca(
    @Param('compraId', ParseIntPipe) compraId: number,
    @Body() dto: CreatePixDto,
    @Req() req: AutheticateRequest,
  ) {
    return this.asassService.criarCobrancaPix(
      compraId,
      req.user.sub,
      dto.cpfCnpj,
    );
  }

  @Get('compra/:compraId/pix/qrcode')
  obterQrCodePix(
    @Param('compraId', ParseIntPipe) compraId: number,
    @Req() req: AutheticateRequest,
  ) {
    return this.asassService.criaQrCodePix(compraId, req.user.sub);
  }
}
