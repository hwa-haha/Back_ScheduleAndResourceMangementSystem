import { ApiProperty } from '@nestjs/swagger';

export class FcmTokenDto {
    @ApiProperty({
        description: 'FCM 토큰',
        example: 'eGb1fxhAPTM6F-XYvVQFNu:APA91bEniVqcKgVLvVeS5Z5FZ5Z5Z5Z5Z5Z5Z5Z5Z5Z',
    })
    fcmToken: string;

    @ApiProperty({
        description: '디바이스 타입',
        example: 'prod',
    })
    deviceType: string;

    @ApiProperty({
        description: '생성 시간',
        example: '2025-09-10T07:14:51.531Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: '업데이트 시간',
        example: '2025-09-10T07:14:51.531Z',
    })
    updatedAt: Date;
}

export class FcmTokenWithEmployeeDto extends FcmTokenDto {
    @ApiProperty({
        description: '직원 ID',
        example: 'emp123',
    })
    employeeId: string;

    @ApiProperty({
        description: '사번',
        example: 'E2023001',
    })
    employeeNumber: string;
}

export class EmployeeTokensDto {
    @ApiProperty({
        description: '직원 ID',
        example: 'emp123',
    })
    employeeId: string;

    @ApiProperty({
        description: '사번',
        example: 'E2023001',
    })
    employeeNumber: string;

    @ApiProperty({
        description: '해당 직원의 FCM 토큰 목록',
        type: [FcmTokenDto],
    })
    tokens: FcmTokenDto[];
}

export class FcmTokenResponseDto {
    @ApiProperty({
        description: '직원별 토큰 정보',
        type: [EmployeeTokensDto],
    })
    byEmployee: EmployeeTokensDto[];

    @ApiProperty({
        description: '모든 토큰 목록 (직원 정보 포함)',
        type: [FcmTokenWithEmployeeDto],
    })
    allTokens: FcmTokenWithEmployeeDto[];

    @ApiProperty({
        description: '총 직원 수',
        example: 5,
    })
    totalEmployees: number;

    @ApiProperty({
        description: '총 토큰 수',
        example: 10,
    })
    totalTokens: number;
}
