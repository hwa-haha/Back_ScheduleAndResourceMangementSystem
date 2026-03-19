import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DeleteFcmTokenItemDto {
    @ApiProperty({
        description: '직원 번호',
        example: '25001',
    })
    @IsString()
    @IsNotEmpty()
    employeeNumber: string;

    @ApiProperty({
        description: '해당 직원의 FCM 토큰 배열',
        example: [
            'eGb1fxhAPTM6F-XYvVQFNu:APA91bEniVqcKgVLvVeS5Z5FZ5Z5Z5Z5Z5Z5Z5Z5Z5Z',
            'aBcD5678efgh:APA91bEniVqcKgVLvVeS5Z5FZ5Z5Z5Z5Z5Z5Z5Z5Z5Z',
        ],
        type: [String],
    })
    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty()
    fcmTokens: string[];
}

export class DeleteFcmTokensRequestDto {
    @ApiProperty({
        description: '직원별 토큰 정보 배열',
        type: [DeleteFcmTokenItemDto],
        example: [
            {
                employeeNumber: '25001',
                fcmTokens: [
                    'eGb1fxhAPTM6F-XYvVQFNu:APA91bEniVqcKgVLvVeS5Z5FZ5Z5Z5Z5Z5Z5Z5Z5Z5Z',
                    'aBcD5678efgh:APA91bEniVqcKgVLvVeS5Z5FZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z',
                ],
            },
            {
                employeeNumber: '25002',
                fcmTokens: ['xYz9876abcd:APA91bEniVqcKgVLvVeS5Z5FZ5Z5Z5Z5Z5Z5Z5Z5Z5Z'],
            },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DeleteFcmTokenItemDto)
    employees: DeleteFcmTokenItemDto[];
}

