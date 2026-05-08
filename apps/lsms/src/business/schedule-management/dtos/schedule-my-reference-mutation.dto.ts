import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ScheduleMyReferenceAddRequestDto {
    @ApiProperty({ description: '내 일정(참조)에 넣을 일정 ID', example: 'uuid-string' })
    @IsUUID()
    scheduleId: string;
}

export class ScheduleMyReferenceMutationResponseDto {
    @ApiProperty({ description: '요청 처리 성공 여부', example: true })
    success: boolean;

    @ApiProperty({
        description: '처리 후 해당 일정이 내 일정(참조)에 포함되는지 여부',
        example: true,
    })
    included: boolean;
}
