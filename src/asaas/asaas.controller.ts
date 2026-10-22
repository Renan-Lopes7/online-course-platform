import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AsaasService } from './asaas.service';

@Controller('asaas')
export class AsaasController {
  constructor(private readonly asassService: AsaasService) {}

  @Get('testar-conecxao/:id')
  testarConexao(@Param('id', ParseIntPipe) userId: number) {
    return this.asassService.garantirClienteAsaas(userId);
  }
}
