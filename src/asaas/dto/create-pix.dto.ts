import { IsNotEmpty, IsString, Validate } from 'class-validator';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { cpf } from 'cpf-cnpj-validator';

@ValidatorConstraint({ name: 'isCpf', async: false })
class IsCpfConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    return typeof value === 'string' && cpf.isValid(value);
  }

  defaultMessage() {
    return 'CPF inválido';
  }
}

export class CreatePixDto {
  @IsString({ message: 'O CPF deve ser enviado como texto.' })
  @IsNotEmpty({ message: 'O CPF é obrigatório.' })
  @Validate(IsCpfConstraint, { message: 'O CPF informado é inválido.' })
  cpfCnpj: string;
}
