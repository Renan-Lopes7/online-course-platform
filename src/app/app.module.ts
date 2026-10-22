import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '../database/database.module';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { CursoModule } from '../curso/curso.module';
import { AulaModule } from '../aula/aula.module';
import { CompraModule } from '../compra/compra.module';
import { AssasModule } from '../asaas/asaas.module';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UserModule,
    AuthModule,
    CursoModule,
    AulaModule,
    CompraModule,
    AssasModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
