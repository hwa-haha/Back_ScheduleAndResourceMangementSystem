import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeleteFcmTokenResultDto {
    @ApiProperty({
        description: '직원 번호',
        example: '25001',
    })
    employeeNumber: string;

    @ApiProperty({
        description: 'FCM 토큰 값',
        example: 'eGb1fxhAPTM6F-XYvVQFNu:APA91bEniVqcKgVLvVeS5Z5FZ5Z5Z5Z5Z5Z5Z5Z5Z5Z',
    })
    fcmToken: string;

    @ApiProperty({
        description: '삭제 성공 여부',
        example: true,
    })
    success: boolean;

    @ApiPropertyOptional({
        description: '에러 메시지 (실패한 경우에만 존재)',
        example: '해당 직원과 FCM 토큰이 연결되어 있지 않습니다.',
    })
    error?: string;
}

export class DeleteFcmTokensResponseDto {
    @ApiProperty({
        description: '각 직원-토큰 조합별 삭제 결과 배열',
        type: [DeleteFcmTokenResultDto],
    })
    results: DeleteFcmTokenResultDto[];

    @ApiProperty({
        description: '전체 삭제 시도 횟수',
        example: 3,
    })
    totalAttempts: number;

    @ApiProperty({
        description: '성공한 삭제 횟수',
        example: 2,
    })
    successCount: number;

    @ApiProperty({
        description: '실패한 삭제 횟수',
        example: 1,
    })
    failCount: number;
}

