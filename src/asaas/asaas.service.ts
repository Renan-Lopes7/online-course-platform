import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/database.service';
import { StatusCompra } from '../generated/prisma/enums';

@Injectable()
export class AsaasService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async garantirClienteAsaas(userId: number, cpfCnpj: string) {
    const usuario = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const apiKey = this.configService.get<string>('ASAAS_API_KEY');
    const baseUrl = this.configService.get<string>('ASAAS_BASE_URL');

    if (!apiKey || !baseUrl) {
      throw new InternalServerErrorException(
        'Configurações do Asaas não encontradas',
      );
    }

    const headers = {
      access_token: apiKey,
      'Content-Type': 'application/json',
      'User-Agent': 'plataform-cursos',
    };

    if (usuario.asaasCustomerId) {
      const response = await fetch(
        `${baseUrl}/customers/${usuario.asaasCustomerId}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ cpfCnpj }),
        },
      );

      if (!response.ok) {
        throw new InternalServerErrorException(
          `Erro ao atualizar cliente no Asaas: HTTP ${response.status}`,
        );
      }

      return { customerId: usuario.asaasCustomerId };
    }

    const response = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: usuario.name,
        email: usuario.email,
        cpfCnpj,
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Erro ao cadastrar cliente no Asaas: HTTP ${response.status}`,
      );
    }

    const clienteAsaas = (await response.json()) as { id: string };

    const usuarioAtualizado = await this.prismaService.user.update({
      where: { id: userId },
      data: { asaasCustomerId: clienteAsaas.id },
    });

    return {
      customerId: usuarioAtualizado.asaasCustomerId,
    };
  }

  async criarCobrancaPix(compraId: number, userId: number, cpfCnpj: string) {
    const compra = await this.prismaService.compra.findFirst({
      where: {
        id: compraId,
        userId,
      },
      include: {
        curso: true,
      },
    });

    if (!compra) {
      throw new NotFoundException('Compra não encontrada');
    }

    if (compra.status !== 'PENDENTE') {
      throw new ConflictException(
        'Apenas compras pendentes podem gerar cobrança',
      );
    }

    if (compra.pagamentoId) {
      throw new ConflictException(
        'Esta compra já possui uma cobrança associada',
      );
    }

    const { customerId } = await this.garantirClienteAsaas(userId, cpfCnpj);

    const apiKey = this.configService.get<string>('ASAAS_API_KEY');
    const baseUrl = this.configService.get<string>('ASAAS_BASE_URL');

    if (!apiKey || !baseUrl) {
      throw new InternalServerErrorException(
        'Configurações do Asaas não encontradas',
      );
    }

    const hoje = new Date();
    hoje.setDate(hoje.getDate() + 1);

    const dueDate = [
      hoje.getFullYear(),
      String(hoje.getMonth() + 1).padStart(2, '0'),
      String(hoje.getDate()).padStart(2, '0'),
    ].join('-');

    const response = await fetch(`${baseUrl}/lean/payments`, {
      method: 'POST',
      headers: {
        access_token: apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'plataform-cursos',
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: 'PIX',
        value: Number(compra.valor),
        dueDate,
        description: `Compra do curso: ${compra.curso.title}`,
        externalReference: String(compra.id),
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Erro ao criar cobrança no Asaas: HTTP ${response.status}`,
      );
    }

    const cobranca = (await response.json()) as { id: string };

    await this.prismaService.compra.update({
      where: { id: compra.id },
      data: { pagamentoId: cobranca.id },
    });

    return {
      compraId: compra.id,
      pagamentoId: cobranca.id,
      status: compra.status,
    };
  }

  async criaQrCodePix(compraId: number, userId: number) {
    const compra = await this.prismaService.compra.findFirst({
      where: { id: compraId, userId },
    });

    if (!compra) {
      throw new NotFoundException('Compra não encontrada');
    }

    if (!compra.pagamentoId) {
      throw new ConflictException('Esta compra não possui uma cobrança Pix');
    }

    const apiKey = this.configService.get<string>('ASAAS_API_KEY');
    const baseUrl = this.configService.get<string>('ASAAS_BASE_URL');

    if (!apiKey || !baseUrl) {
      throw new InternalServerErrorException(
        'Configurações do Asaas não encontradas',
      );
    }

    const response = await fetch(
      `${baseUrl}/payments/${compra.pagamentoId}/pixQrCode`,
      {
        method: 'GET',
        headers: {
          access_token: apiKey,
          'User-Agent': 'plataform-cursos',
        },
      },
    );

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Erro ao consultar QR Code Pix: HTTP ${response.status}`,
      );
    }
    const qrCode = (await response.json()) as {
      encodedImage: string;
      payload: string;
      expirationDate: string | null;
    };

    return {
      compraId: compra.id,
      pagamentoId: compra.pagamentoId,
      encodedImage: qrCode.encodedImage,
      payload: qrCode.payload,
      expirationDate: qrCode.expirationDate,
    };
  }

  async buscarCompraPorPagamento(pagamentoId: string) {
    return this.prismaService.compra.findUnique({
      where: { pagamentoId },
    });
  }

  async consultarStatusPagamento(pagamentoId: string) {
    const apiKey = this.configService.get<string>('ASAAS_API_KEY');
    const baseUrl = this.configService.get<string>('ASAAS_BASE_URL');

    if (!apiKey || !baseUrl) {
      throw new InternalServerErrorException(
        'Configurações do Asaas não encontradas',
      );
    }

    const response = await fetch(`${baseUrl}/payments/${pagamentoId}/status`, {
      method: 'GET',
      headers: {
        access_token: apiKey,
        'User-Agent': 'plataform-cursos',
      },
    });
    if (!response.ok) {
      throw new InternalServerErrorException(
        `Erro ao consultar pagamento no Asaas ${response.status}`,
      );
    }
    const resultado = (await response.json()) as {
      status: string;
    };

    return resultado.status;
  }

  async confirmarPagamento(compraId: number) {
    const compra = await this.prismaService.compra.findUnique({
      where: { id: compraId },
    });

    if (!compra) {
      throw new NotFoundException('Compra não encontrada');
    }

    if (compra.status === 'PAGO') {
      return compra;
    }

    if (compra.status !== 'PENDENTE') {
      throw new ConflictException(
        'A compra não esta pendente e não pode ser paga',
      );
    }

    const resultado = await this.prismaService.compra.updateMany({
      where: { id: compraId, status: StatusCompra.PENDENTE },
      data: {
        status: StatusCompra.PAGO,
        pagoEm: new Date(),
      },
    });

    if (resultado.count === 0) {
      const compraAtualizada = await this.prismaService.compra.findUnique({
        where: { id: compraId },
      });

      if (compraAtualizada?.status === 'PAGO') {
        return compraAtualizada;
      }

      throw new ConflictException(
        'A compra não está pendente e não pode ser paga',
      );
    }

    return this.prismaService.compra.findFirstOrThrow({
      where: { id: compraId },
    });
  }
}
