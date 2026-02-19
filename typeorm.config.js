const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.join(process.cwd(), 'apps/lams/.env') });

const { DataSource } = require('typeorm');

const isProduction = process.env.NODE_ENV === 'production';

// migration:run 은 node 만 사용(ts-node 없음) → 빌드된 .js 마이그레이션만 사용, entities 비움
module.exports = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'resource_management',
    schema: process.env.POSTGRES_SCHEMA || 'public',
    entities: [],
    migrations: [path.join(__dirname, 'dist/lams-migrations/*.js')],
    synchronize: false,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    logging: true,
});
