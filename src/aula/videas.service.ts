import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VideasService {
  constructor(private readonly configService: ConfigService) {}

  async criarSessaoUpload(filename: string, size: number) {
    const apiKey = this.configService.get<string>('VIDEAS_API_KEY');
    const workspaceId = this.configService.get<string>('VIDEAS_WORKSPACE_ID');

    if (!apiKey || !workspaceId) {
      throw new InternalServerErrorException(
        'Configure VIDEAS_API_KEY e VIDEAS_WORKSPACE_ID no .env',
      );
    }

    if (
      !filename?.trim() ||
      !Number.isSafeInteger(size) ||
      size <= 0 ||
      size > 10 * 1024 * 1024 * 1024
    ) {
      throw new InternalServerErrorException(
        'Nome ou tamanho de arquivo inválido (limite de 10 GiB)',
      );
    }

    const response = await fetch('https://api.videas.com/v1/uploads', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspace_id: workspaceId,
        filename,
        size_bytes: size,
      }),
    });

    const body = await response.text();

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Erro ao criar upload no Videas (${response.status}): ${body.slice(0, 300)}`,
      );
    }

    const data = JSON.parse(body);

    if (!data.upload_url || !data.upload_token) {
      throw new InternalServerErrorException(
        'O Videas não retornou os dados necessários para o upload',
      );
    }

    return {
      uploadId: data.id,
      assetId: data.asset_id,
      uploadUrl: data.upload_url,
      uploadToken: data.upload_token,
      maxPutBytes: data.max_put_bytes,
      expiresAt: data.expires_at,
    };
  }

  async criarTokenPlayback(embedId: string) {
    if (!embedId?.trim()) {
      throw new InternalServerErrorException(
        'O identificador do embed é obrigatório',
      );
    }

    const response = await fetch(
      `https://app.videas.com/api/visitor/embed/${encodeURIComponent(embedId)}/`,
    );

    const body = await response.text();

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Erro ao consultar embed no Videas (${response.status}): ${body.slice(0, 300)}`,
      );
    }

    try {
      return JSON.parse(body);
    } catch {
      throw new InternalServerErrorException(
        'O Videas retornou uma resposta inválida ao consultar o embed',
      );
    }
  }

  async obterInformacoesPlayback(assetId: string, playbackToken: string) {
    if (!assetId?.trim() || !playbackToken?.trim()) {
      throw new InternalServerErrorException(
        'Asset ID e token de playback são obrigatórios',
      );
    }

    const response = await fetch(
      'https://app.videas.com/api/visitor/playback/info/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset_id: assetId,
          playback_token: playbackToken,
        }),
      },
    );

    const body = await response.text();

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Erro ao obter playback do Videas (${response.status}): ${body.slice(0, 300)}`,
      );
    }

    try {
      return JSON.parse(body);
    } catch {
      throw new InternalServerErrorException(
        'O Videas retornou informações de playback inválidas',
      );
    }
  }
}
