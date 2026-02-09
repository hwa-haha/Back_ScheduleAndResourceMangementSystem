import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getTypeOrmConfig = (): TypeOrmModuleOptions => {
    const config: TypeOrmModuleOptions = {
        type: 'postgres',
        host: '192.168.10.11',
        port: 5432,
        username: 'admin',
        password: 'tech7admin!',
        database: 'attendance-server',
        autoLoadEntities: true,
    };
    return config;
};
