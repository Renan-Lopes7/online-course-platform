import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/database.service';

@Injectable()
export class AsaasService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async garantirClienteAsaas(userId: number) {
    const usuario = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (usuario.asaasCustomerId) {
      return { customerId: usuario.asaasCustomerId };
    }

    const apiKey = this.configService.get<string>('ASAAS_API_KEY');
    const baseUrl = this.configService.get<string>('ASAAS_BASE_URL');

    if (!apiKey || !baseUrl) {
      throw new InternalServerErrorException(
        'Configurações do Asaas não encontradas',
      );
    }

    const response = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        access_token: apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'plataforma-cursos',
      },
      body: JSON.stringify({
        name: usuario.name,
        email: usuario.email,
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Erro na comunicação com o Asaas: HTTP ${response.status}`,
      );
    }

    const clienteAsaas = await response.json();

    const usuarioAtualizado = await this.prismaService.user.update({
      where: { id: userId },
      data: { asaasCustomerId: clienteAsaas.id },
    });

    return {
      customerId: usuarioAtualizado.asaasCustomerId,
    };
  }
}
