import { Module, forwardRef } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { PrismaModule } from '../../database/prisma.module';
import { ChatModule } from '../chat/chat.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
    imports: [PrismaModule, ChatModule, forwardRef(() => PaymentsModule)],
    controllers: [TransactionsController],
    providers: [TransactionsService],
    exports: [TransactionsService]
})
export class TransactionsModule {}
