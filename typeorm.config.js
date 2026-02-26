const path = require('path');
const { config } = require('dotenv');
config();

const { DataSource } = require('typeorm');

const isProduction = process.env.NODE_ENV === 'production';

console.log(
    process.env.POSTGRES_HOST,
    process.env.POSTGRES_PORT,
    process.env.POSTGRES_USER,
    process.env.POSTGRES_PASSWORD,
    process.env.POSTGRES_DB,
    process.env.POSTGRES_SCHEMA,
);

// migration:run 은 node 만 사용(ts-node 없음) → 빌드된 .js 마이그레이션만 사용, entities 비움
module.exports = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    schema: process.env.POSTGRES_SCHEMA,
    entities: [],
    migrations: [path.join(__dirname, 'dist/migrations/*.js')],
    synchronize: false,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    logging: true,
});
