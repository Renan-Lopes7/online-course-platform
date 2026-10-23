import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateAulaDto {
  @IsString({ message: 'O título deve ser um texto.' })
  @IsNotEmpty({ message: 'O título da aula é obrigatório.' })
  @MaxLength(150, {
    message: 'O título deve ter no máximo 150 caracteres.',
  })
  title: string;

  @IsString({ message: 'O ID do vídeo deve ser um texto.' })
  @IsNotEmpty({ message: 'O ID do vídeo é obrigatório.' })
  @MaxLength(255, {
    message: 'O ID do vídeo deve ter no máximo 255 caracteres.',
  })
  videoUrl: string;
}
