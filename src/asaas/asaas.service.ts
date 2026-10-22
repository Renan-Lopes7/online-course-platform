import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AsaasService {
  constructor(private readonly configService: ConfigService) {}

  async testarConexao() {
    const apiKey = this.configService.get<string>('ASAAS_API_KEY');
    const baseUrl = this.configService.get<string>('ASAAS_BASE_URL');

    if (!apiKey || !baseUrl) {
      throw new InternalServerErrorException(
        'Configurações do Asaas não encontradas',
      );
    }

    const response = await fetch(`${baseUrl}/customers?limit=1`, {
      method: 'GET',
      headers: {
        access_token: apiKey,
        'User-Agent': 'plataform-cursos',
      },
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Erro na comunicação com o Asaas: HTTP ${response.status}`,
      );
    }

    return response.json();
  }
}
