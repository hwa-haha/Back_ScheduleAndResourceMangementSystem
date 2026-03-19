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
        const employee = await this.dataSource
            .getRepository(Employee)
            .findOne({ where: { employeeNumber: payload.employeeNumber } });
        if (!employee || employee.employeeNumber !== payload.employeeNumber) {
            throw new UnauthorizedException();
        }

        return employee;
    }
}
