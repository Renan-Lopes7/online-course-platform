import { Controller, Get } from '@nestjs/common';
import { AsaasService } from './asaas.service';

@Controller('asaas')
export class AsaasController {
  constructor(private readonly asassService: AsaasService) {}

  @Get('testar-conecxao')
  testarConexao() {
    return this.asassService.testarConexao();
  }
}
