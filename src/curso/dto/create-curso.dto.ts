import {
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCursoDto {
  @IsString({ message: 'O título do curso deve ser um texto.' })
  @IsNotEmpty({ message: 'O título do curso é obrigatório.' })
  @MaxLength(150, {
    message: 'O título do curso deve ter no máximo 150 caracteres.',
  })
  title: string;

  @IsString({ message: 'A descrição deve ser um texto.' })
  @IsNotEmpty({ message: 'A descrição do curso é obrigatória.' })
  @MaxLength(2000, {
    message: 'A descrição deve ter no máximo 2000 caracteres.',
  })
  description: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'O preço deve ser um número com até duas casas decimais.' },
  )
  @Min(0.01, { message: 'O preço deve ser maior que zero.' })
  price: number;
}
