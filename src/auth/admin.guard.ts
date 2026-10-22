import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

interface AutheticateRequest extends Request {
  user: {
    sub: number;
    role: 'USER' | 'ADMIN';
  };
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AutheticateRequest>();

    if (request.user?.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permisão para realizar esta ação',
      );
    }

    return true;
  }
}
