import 'dotenv/config';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AsaasService } from './asaas.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreatePixDto } from './dto/create-pix.dto';
import { ConfigService } from '@nestjs/config';

interface AutheticateRequest {
  user: { sub: number };
}
@Controller('asaas')
export class AsaasController {
  constructor(
    private readonly asassService: AsaasService,
    private readonly configService: ConfigService,
  ) {}

  @Post('compra/:compraId/pix')
  @UseGuards(AuthGuard)
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
  @UseGuards(AuthGuard)
  obterQrCodePix(
    @Param('compraId', ParseIntPipe) compraId: number,
    @Req() req: AutheticateRequest,
  ) {
    return this.asassService.criaQrCodePix(compraId, req.user.sub);
  }

  @Post('webhook')
  async receberWebhook(
    @Headers('asaas-access-token') token: string,
    @Body() body: any,
  ) {
    const tokenEsperado = this.configService.get<string>('ASAAS_WEBHOOK_TOKEN');

    if (!tokenEsperado || token !== tokenEsperado) {
      throw new UnauthorizedException('Token do webhook inválido');
    }

    const pagamentoId = body.payment?.id;

    if (!pagamentoId)
      throw new BadRequestException('ID do pagamento náo informado');

    const compra =
      await this.asassService.buscarCompraPorPagamento(pagamentoId);

    if (!compra) throw new NotFoundException('Compra não encontrada');

    if (body.event !== 'PAYMENT_RECEIVED') {
      return {
        recebido: true,
        ignorado: true,
        evento: body.event,
      };
    }

    const statusAsaas =
      await this.asassService.consultarStatusPagamento(pagamentoId);

    if (statusAsaas !== 'RECEIVED') {
      return {
        recebido: true,
        compraId: compra.id,
        statusAsaas,
        atualizado: false,
      };
    }

    const compraAtualizada = await this.asassService.confirmarPagamento(
      compra.id,
    );

    return {
      recebido: true,
      compraId: compraAtualizada.id,
      status: compraAtualizada.status,
    };
  }
}
