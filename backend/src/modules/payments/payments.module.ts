import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService]
})
export class PaymentsModule {}
