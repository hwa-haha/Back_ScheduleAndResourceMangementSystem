import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../../src/app.module';

/**
 * e2e 테스트용 앱 생성/종료
 */
export class TestSetup {
    static async createTestApp(): Promise<INestApplication> {
        const moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        const app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ transform: true }));
        await app.init();
        return app;
    }

    static async closeTestApp(app: INestApplication): Promise<void> {
        await app?.close();
    }
}
