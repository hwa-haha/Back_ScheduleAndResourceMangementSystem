import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();
const isProduction = process.env.NODE_ENV === 'production';

export default new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'resource_management',
    schema: process.env.POSTGRES_SCHEMA || 'public',
    entities: [
        join(__dirname, 'apps/lams/src/domain/**/*.entity.{ts,js}'),
        join(__dirname, 'apps/lsms/src/domain/**/*.entity.{ts,js}'),
    ],
    migrations: [join(__dirname, 'libs/migrations/*.{ts,js}')],

    synchronize: false,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    logging: true,
});
