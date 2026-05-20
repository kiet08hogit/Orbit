import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { ListingsModule } from './modules/listings/listings.module';
// You'll import your other modules (Health, Users, etc.) here later

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true, // This allows you to use ConfigService anywhere without importing the module
        }),
        PrismaModule,
        HealthModule,
        UsersModule,
        ListingsModule

    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
