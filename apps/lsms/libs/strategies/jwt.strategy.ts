import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Employee } from '@libs/modules/employee/employee.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly dataSource: DataSource,
        configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('jwt.secret'),
        });
    }

    async validate(payload: any) {
        console.log(`[JwtStrategy] payload.employeeNumber=${payload?.employeeNumber ?? '없음'}`);
        const employee = await this.dataSource
            .getRepository(Employee)
            .findOne({ where: { employeeNumber: payload.employeeNumber } });
        console.log(`[JwtStrategy] DB 조회 결과: ${employee ? '존재함' : '없음'}`);
        if (!employee || employee.employeeNumber !== payload.employeeNumber) {
            console.log('[JwtStrategy] validate 실패: employeeNumber 불일치 또는 사용자 없음');
            throw new UnauthorizedException();
        }

        console.log('[JwtStrategy] validate 성공');
        return employee;
    }
}
