import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { EmployeeMicroserviceAdapter } from './adapters';

@Module({
    imports: [
        HttpModule.register({
            timeout: 10000, // 10�??�?�아??
            maxRedirects: 5,
        }),
        ConfigModule,
    ],
    providers: [EmployeeMicroserviceAdapter],
    exports: [EmployeeMicroserviceAdapter],
})
export class DomainEmployeeModule {}
