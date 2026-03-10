import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/** e2e용 테스트 사용자 (52100·52200·52300) */
const TEST_USER_PAYLOAD = {
    id: '839e6f06-8d44-43a1-948c-095253c4cf8c',
    employeeNumber: '24016',
    name: '김규현',
    email: 'kim.kyuhyun@lumir.space',
};

export class TestHelpers {
    static createValidJwtToken(app: INestApplication): string {
        const jwtService = app.get<JwtService>(JwtService);
        return jwtService.sign(TEST_USER_PAYLOAD);
    }
}
