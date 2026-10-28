import { Module } from '@nestjs/common';
import { AulaService } from './aula.service';
import { AulaController } from './aula.controller';
import { VideasService } from './videas.service';

@Module({
  controllers: [AulaController],
  providers: [AulaService, VideasService],
})
export class AulaModule {}
