import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAulaDto } from './dto/create-aula.dto';
import { UpdateAulaDto } from './dto/update-aula.dto';
import { PrismaService } from '../database/database.service';
import { VideasService } from './videas.service';

@Injectable()
export class AulaService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly videasService: VideasService,
  ) {}

  create(cursoId: number, createAulaDto: CreateAulaDto) {
    return this.prismaService.aula.create({
      data: {
        title: createAulaDto.title,
        videoId: createAulaDto.videoId,
        curso: {
          connect: { id: cursoId },
        },
      },
    });
  }

  async findAll(cursoId: number, userId: number) {
    const compra = await this.prismaService.compra.findFirst({
      where: {
        userId,
        cursoId,
        status: 'PAGO',
      },
    });

    if (!compra) {
      throw new ForbiddenException('Você não tem acesso a este curso');
    }

    const aulas = await this.prismaService.aula.findMany({
      where: { cursoId },
    });

    if (aulas.length === 0) {
      throw new NotFoundException('Essas aulas não existem para esse curso');
    }

    return aulas;
  }

  async findOne(id: number, userId: number) {
    const aula = await this.prismaService.aula.findFirst({ where: { id } });
    if (!aula) throw new NotFoundException('Aula não encontrada');

    const compra = await this.prismaService.compra.findFirst({
      where: {
        userId,
        cursoId: aula.cursoId,
        status: 'PAGO',
      },
    });
    if (!compra) {
      throw new ForbiddenException('Você não tem acesso a este curso');
    }

    return aula;
  }

  async obterPlayback(id: number, userId: number) {
    const aula = await this.findOne(id, userId);

    if (!aula.videoId?.trim()) {
      throw new NotFoundException(
        'Esta aula ainda não possui um vídeo cadastrado',
      );
    }

    return aula.videoId;
  }

  async obterDadosPlayback(id: number, userId: number) {
    const aula = await this.findOne(id, userId);

    if (!aula.embedId?.trim()) {
      throw new NotFoundException(
        'O vídeo desta aula está temporariamente indisponível',
      );
    }

    const embed = await this.videasService.criarTokenPlayback(aula.embedId);

    const assetId = embed.items?.[0]?.asset?.uid;
    const playbackToken = embed.playback_token;

    if (!assetId || !playbackToken) {
      throw new NotFoundException(
        'Não foi possível obter os dados de reprodução do vídeo',
      );
    }

    const playback = await this.videasService.obterInformacoesPlayback(
      assetId,
      playbackToken,
    );

    if (playback.blocked || !playback.hls_url?.url) {
      throw new ForbiddenException(
        'Este vídeo não está disponível para reprodução',
      );
    }

    return {
      type: playback.type,
      hlsUrl: playback.hls_url.url,
      expiresAt: playback.hls_url.expires_at,
    };
  }

  async obterDadosPlaybackAdmin(id: number) {
    const aula = await this.findOneAdmin(id);

    if (!aula.embedId?.trim()) {
      throw new NotFoundException(
        'O vídeo desta aula está temporariamente indisponível.',
      );
    }

    const embed = await this.videasService.criarTokenPlayback(aula.embedId);

    const assetId = embed.items?.[0]?.asset?.uid;
    const playbackToken = embed.playback_token;

    if (!assetId || !playbackToken) {
      throw new NotFoundException('Não foi possível obter o vídeo desta aula.');
    }

    const playback = await this.videasService.obterInformacoesPlayback(
      assetId,
      playbackToken,
    );

    if (playback.blocked || !playback.hls_url?.url) {
      throw new ForbiddenException(
        'Este vídeo não está disponível para reprodução.',
      );
    }

    return {
      type: playback.type,
      hlsUrl: playback.hls_url.url,
      expiresAt: playback.hls_url.expires_at,
    };
  }

  async findAllAdmin(cursoId: number) {
    const curso = await this.prismaService.curso.findUnique({
      where: { id: cursoId },
    });

    if (!curso) throw new NotFoundException('Este curso não existe');

    return this.prismaService.aula.findMany({
      where: { cursoId },
    });
  }

  async findOneAdmin(id: number) {
    const aula = await this.prismaService.aula.findUnique({
      where: { id },
    });
    if (!aula) throw new NotFoundException('Esta aula não existe');
    return aula;
  }

  async update(id: number, updateAulaDto: UpdateAulaDto) {
    const aula = await this.prismaService.aula.findUnique({ where: { id } });
    if (!aula) throw new NotFoundException('Aula não encontrada');

    return await this.prismaService.aula.update({
      where: { id },
      data: updateAulaDto,
    });
  }

  async remove(id: number) {
    const aula = await this.prismaService.aula.findUnique({ where: { id } });
    if (!aula) throw new NotFoundException('Aula não encontrada');

    return this.prismaService.aula.delete({
      where: { id },
    });
  }
}
