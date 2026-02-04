import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsUUID,
    IsNotEmpty,
    ValidateIf,
    IsOptional,
    IsArray,
    ArrayMinSize,
    ArrayMaxSize,
} from 'class-validator';

/**
 * 일간 요약 수정 요청 DTO
 *
 * 출퇴근 시간 또는 근태유형 중 하나만 수정 가능합니다.
 * - 출퇴근 시간 수정: enter 또는 leave 중 하나 이상 제공 (둘 다 제공 가능)
 * - 근태유형 수정: attendanceTypeId를 제공
 */
export class UpdateDailySummaryRequestDto {
    @ApiProperty({
        description:
            '출근 시간 (출퇴근 시간 수정 시 선택, enter 또는 leave 중 하나 이상 필수, 근태유형 수정 시 불필요)',
        example: '09:00:00',
        required: false,
    })
    @ValidateIf((o) => !o.attendanceTypeIds || o.attendanceTypeIds.length === 0)
    @IsOptional()
    @IsString()
    enter?: string;

    @ApiProperty({
        description:
            '퇴근 시간 (출퇴근 시간 수정 시 선택, enter 또는 leave 중 하나 이상 필수, 근태유형 수정 시 불필요)',
        example: '18:00:00',
        required: false,
    })
    @ValidateIf((o) => !o.attendanceTypeIds || o.attendanceTypeIds.length === 0)
    @IsOptional()
    @IsString()
    leave?: string;

    @ApiProperty({
        description: `근태 유형 ID 배열 (근태유형 수정 시 필수, 최대 2개까지, 출퇴근 시간 수정 시 불필요)
        
근태 유형 ID 목록:
- 7d45683d-7476-4e86-859f-961637e48526: 연차
- 1d6c5ba5-aeca-470b-9277-259d673b5e0d: 오전반차
- 71f93733-6cab-4cab-bbaa-95a95814dc0c: 오후반차
- a9c8ff8a-c352-4049-be2b-3a0d27f3d380: 공가
- 9aaf5f97-ecdf-47b0-89c5-a7bd92da8655: 오전공가
- 75160594-81c4-48b3-bb80-6c1ab9082536: 오후공가
- b3b3be88-100c-436d-a772-3b0daeecf352: 출장
- f4482432-fab2-4b2d-8efc-fe3a216d3015: 오전출장
- 1d35f520-7f61-47f1-ab7d-0d7ad8e70725: 오후출장
- 55181add-95a5-4908-95de-0a4b77ac5e07: 교육
- 33e5d2ad-7481-4f27-97f4-59b708a53f98: 오전교육
- bb07d807-1a25-4164-a1ee-ffe64ab277ea: 오후교육
- 287c156f-70d4-4eca-b482-d17b0be6d620: 경조휴가
- 6f97ad90-1b39-4450-9d92-7517bdaed833: 보건휴가(오전 반차)
- 7e098c10-880b-463f-85b2-88d11f541249: 병가
- 3eb5efba-a7d4-4828-9118-0d360f55a7d7: 생일오전반차
- bc84e4a1-bb97-4a8f-b04b-88d0d65e4895: 생일오후반차
- f99cbfc9-456e-43a0-bf60-717b9bf65dc5: 대체휴가
- c5d8642a-6697-44b9-9eab-715ac3aa2198: 오전대체휴가
- 140bcff6-c34f-419c-8ea6-826e4243d0c3: 오후대체휴가
- fd7dee04-cfc1-4c8f-9aea-c8d8876aa6cb: 무급휴가
- 3d2f3517-8aef-4277-b055-bb5d7a0b5e22: 보건휴가(오전반차)
- ec38a9d6-0c28-4d4b-bd0d-6fb6e173f479: 국내출장
- e5242c22-9be8-4fb3-b041-dfa01614539d: 국외출장
- 012db601-840d-4777-b1ee-4eecdd7df041: 사외교육
- fe305bb7-f228-4695-90af-9ad46fd57424: 사내교육`,
        example: ['7d45683d-7476-4e86-859f-961637e48526'],
        type: [String],
        required: false,
    })
    @ValidateIf((o) => !o.enter && !o.leave)
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(2, { message: '근태유형은 최대 2개까지 설정 가능합니다.' })
    @IsUUID(undefined, { each: true })
    attendanceTypeIds?: string[];

    @ApiProperty({
        description: '메모 (일간 요약 note 필드에 저장되며, 수정이력의 reason에도 기록됨)',
        example: '출입기록 오류로 인한 수정',
        required: false,
    })
    @IsString()
    @IsOptional()
    note?: string;
}

/**
 * 일간 요약 수정 응답 DTO
 */
export class UpdateDailySummaryResponseDto {
    @ApiProperty({ description: '수정된 일간 요약 정보' })
    dailySummary: {
        id: string;
        date: string;
        employeeId: string | null;
        monthlyEventSummaryId: string | null;
        isHoliday: boolean;
        enter: string | null;
        leave: string | null;
        realEnter: string | null;
        realLeave: string | null;
        isChecked: boolean;
        isLate: boolean;
        isEarlyLeave: boolean;
        isAbsent: boolean;
        workTime: number | null;
        note: string | null;
        usedAttendances: Array<{
            attendanceTypeId: string;
            title: string;
            workTime?: number;
            isRecognizedWorkTime?: boolean;
            startWorkTime?: string | null;
            endWorkTime?: string | null;
            deductedAnnualLeave?: number;
        }> | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt?: Date;
        createdBy?: string;
        updatedBy?: string;
        version: number;
    };
}
