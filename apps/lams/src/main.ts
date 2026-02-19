import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestInterceptor } from '../libs/interceptors/request.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from '../libs/swagger/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { config } from 'dotenv';

// 환경 변수 로드 (프로젝트 루트의 .env 파일)
config();

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // const isProduction = process.env.NODE_ENV === 'production';
    // app.enableCors({
    //     origin: isProduction
    //         ? function (origin, callback) {
    //               console.log('isProduction :', isProduction);
    //               console.log('origin :', origin);
    //               const whitelist = [
    //                   'https://lrms.lumir.space',
    //                   'https://rms-backend-iota.vercel.app',
    //                   'https://lrms-dev.lumir.space',
    //                   'http://localhost:3002',
    //               ];
    //               if (!isProduction || !origin || whitelist.includes(origin)) {
    //                   callback(null, true);
    //               } else {
    //                   callback(new Error('Not allowed by CORS'));
    //               }
    //           }
    //         : true,
    //     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    //     credentials: true,
    // });

    app.setGlobalPrefix('api');
    // app.useGlobalGuards(new JwtAuthGuard(app.get(Reflector)));
    // 전역 인터셉터 등록
    app.useGlobalInterceptors(new RequestInterceptor());
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    setupSwagger(app, []);
    await app.listen(process.env.APP_PORT || 3060);
}
bootstrap();
