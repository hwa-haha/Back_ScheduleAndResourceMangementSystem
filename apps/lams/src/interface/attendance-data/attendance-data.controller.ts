import { Controller, Get, Query, Patch, Body, Param, BadRequestException, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { User } from '../../../libs/decorators/user.decorator';
import { AttendanceDataBusinessService } from '../../business/attendance-data-business/attendance-data-business.service';
import { GetMonthlySummariesRequestDto, GetMonthlySummariesResponseDto } from './dto/get-monthly-summaries.dto';
import { IGetMonthlySummariesResponse } from '../../context/attendance-data-context/interfaces/response/get-monthly-summaries-response.interface';
import { UpdateDailySummaryRequestDto, UpdateDailySummaryResponseDto } from './dto/update-daily-summary.dto';
import {
    SaveAttendanceSnapshotRequestDto,
    SaveAttendanceSnapshotResponseDto,
} from './dto/save-attendance-snapshot.dto';
import { RestoreFromSnapshotRequestDto, RestoreFromSnapshotResponseDto } from './dto/restore-from-snapshot.dto';
import { GetSnapshotListRequestDto, GetSnapshotListResponseDto } from './dto/get-snapshot-list.dto';
import { IGetSnapshotListResponse } from '../../context/data-snapshot-context/interfaces/response/get-snapshot-list-response.interface';
import { IGetSnapshotByIdResponse } from '../../context/data-snapshot-context/interfaces/response/get-snapshot-by-id-response.interface';
import { GetDailySummaryHistoryResponseDto } from './dto/get-daily-summary-history.dto';
import { IGetDailySummaryHistoryResponse } from '../../context/attendance-data-context/interfaces/response/get-daily-summary-history-response.interface';
import { GetDailySummaryDetailResponseDto } from './dto/get-daily-summary-detail.dto';
import { IGetDailySummaryDetailResponse } from '../../context/attendance-data-context/interfaces/response/get-daily-summary-detail-response.interface';
import { GetMonthlySummaryNoteResponseDto } from './dto/get-monthly-summary-note.dto';
import { IGetMonthlySummaryNoteResponse } from '../../context/attendance-data-context/interfaces/response/get-monthly-summary-note-response.interface';
import {
    UpdateMonthlySummaryNoteRequestDto,
    UpdateMonthlySummaryNoteResponseDto,
} from './dto/update-monthly-summary-note.dto';
import { IUpdateMonthlySummaryNoteResponse } from '../../context/attendance-data-context/interfaces/response/update-monthly-summary-note-response.interface';
import { CheckEmployeeSnapshotExistsResponseDto } from './dto/check-employee-snapshot-exists.dto';
import { ICheckEmployeeSnapshotExistsResponse } from '../../context/data-snapshot-context/interfaces/response/check-employee-snapshot-exists-response.interface';

/**
 * 출입/근태 데이터 컨트롤러
 *
 * 출입/근태 데이터 조회 API를 제공합니다.
 */
@ApiTags('2. 출입/근태 데이터')
@ApiBearerAuth()
@Controller('attendance-data')
export class AttendanceDataController {
    constructor(private readonly attendanceDataBusinessService: AttendanceDataBusinessService) {}

    /**
     * 월간 요약 조회
     *
     * 연도, 월, 부서ID를 기준으로 월간 요약, 일간 요약, 일간 요약의 수정이력을 조회합니다.
     */
    @Get('monthly-summaries')
    @ApiOperation({
        summary: '월간 요약 조회',
        description: '연도, 월, 부서ID를 기준으로 월간 요약, 일간 요약, 일간 요약의 수정이력을 조회합니다.',
    })
    @ApiQuery({ name: 'year', description: '연도', example: '2026', required: true })
    @ApiQuery({ name: 'month', description: '월', example: '01', required: true })
    @ApiQuery({
        name: 'departmentId',
        description: '부서 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: true,
    })
    @ApiResponse({
        status: 200,
        description: '월간 요약 조회 성공',
        type: GetMonthlySummariesResponseDto,
    })
    async getMonthlySummaries(
        @Query('year') year: string,
        @Query('month') month: string,
        @Query('departmentId') departmentId: string,
    ): Promise<IGetMonthlySummariesResponse> {
        if (!year || !month || !departmentId) {
            throw new BadRequestException('연도, 월, 부서ID는 필수입니다.');
        }

        const result = await this.attendanceDataBusinessService.월간요약을조회한다({
            year,
            month,
            departmentId,
        });

        return result;
    }

    /**
     * 일간 요약 수정
     *
     * 일간 요약의 출근시간, 퇴근시간 또는 근태유형을 수정하고 수정이력을 생성합니다.
     * 출퇴근 시간 수정과 근태유형 수정은 동시에 할 수 없으며, 둘 중 하나만 선택하여 수정할 수 있습니다.
     */
    @Patch('daily-summaries/:id')
    @ApiOperation({
        summary: '일간 요약 수정',
        description: `일간 요약의 출근시간/퇴근시간 또는 근태유형을 수정하고 수정이력을 생성합니다.

**수정 유형:**
- 출퇴근 시간 수정: enter와 leave를 함께 제공
- 근태유형 수정: attendanceTypeId를 제공

**근태 유형 ID 목록:**
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
    })
    @ApiParam({ name: 'id', description: '일간 요약 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    async updateDailySummary(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateDailySummaryRequestDto,
        @User('id') performedBy: string,
    ): Promise<UpdateDailySummaryResponseDto> {
        if (!performedBy) {
            throw new BadRequestException('사용자 정보를 찾을 수 없습니다.');
        }

        const result = await this.attendanceDataBusinessService.일간요약을수정한다({
            dailySummaryId: id,
            enter: dto.enter,
            leave: dto.leave,
            attendanceTypeIds: dto.attendanceTypeIds,
            note: dto.note,
            performedBy,
        });

        return result;
    }

    /**
     * 일간 요약 수정이력 조회
     *
     * 일간 요약 ID를 기준으로 해당 일간 요약의 수정이력을 조회합니다.
     */
    @Get('daily-summaries/:id/history')
    @ApiOperation({
        summary: '일간 요약 수정이력 조회',
        description:
            '일간 요약 ID를 기준으로 해당 일간 요약의 수정이력을 조회합니다. 변경 시간 내림차순으로 정렬되어 반환됩니다.',
    })
    @ApiParam({ name: 'id', description: '일간 요약 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({
        status: 200,
        description: '일간 요약 수정이력 조회 성공',
        type: GetDailySummaryHistoryResponseDto,
    })
    async getDailySummaryHistory(@Param('id', ParseUUIDPipe) id: string): Promise<IGetDailySummaryHistoryResponse> {
        const result = await this.attendanceDataBusinessService.일간요약수정이력을조회한다({
            dailyEventSummaryId: id,
        });

        return result;
    }

    /**
     * 일간 요약 상세 조회
     *
     * 일간 요약 ID를 기준으로 해당 일간 요약의 상세 정보, 수정이력, 근태 이슈를 조회합니다.
     */
    @Get('daily-summaries/:id')
    @ApiOperation({
        summary: '일간 요약 상세 조회',
        description: '일간 요약 ID를 기준으로 해당 일간 요약의 상세 정보, 수정이력, 근태 이슈를 조회합니다.',
    })
    @ApiParam({ name: 'id', description: '일간 요약 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({
        status: 200,
        description: '일간 요약 상세 조회 성공',
        type: GetDailySummaryDetailResponseDto,
    })
    async getDailySummaryDetail(@Param('id', ParseUUIDPipe) id: string): Promise<IGetDailySummaryDetailResponse> {
        const result = await this.attendanceDataBusinessService.일간요약상세를조회한다({
            dailySummaryId: id,
        });

        return result;
    }

    /**
     * 근태 스냅샷 저장
     *
     * 월간 요약 데이터를 기준으로 스냅샷을 생성합니다.
     */
    @Post('snapshots')
    @ApiOperation({
        summary: '근태 스냅샷 저장',
        description:
            '월간 요약 데이터를 기준으로 스냅샷을 생성합니다. 연월을 기준으로 회사 전체 월간 요약 데이터를 스냅샷으로 저장합니다.',
    })
    async saveAttendanceSnapshot(
        @Body() dto: SaveAttendanceSnapshotRequestDto,
        @User('id') performedBy: string,
    ): Promise<SaveAttendanceSnapshotResponseDto> {
        if (!performedBy) {
            throw new BadRequestException('사용자 정보를 찾을 수 없습니다.');
        }

        if (!dto.year || !dto.month) {
            throw new BadRequestException('연도, 월은 필수입니다.');
        }

        const result = await this.attendanceDataBusinessService.근태스냅샷을저장한다({
            year: dto.year,
            month: dto.month,
            performedBy,
        });

        return result;
    }

    /**
     * 스냅샷으로부터 복원
     *
     * 선택된 스냅샷 데이터를 기반으로 월간/일간 요약 데이터를 덮어씌웁니다.
     */
    @Post('snapshots/restore')
    @ApiOperation({
        summary: '스냅샷으로부터 복원',
        description:
            '선택된 스냅샷 데이터를 기반으로 월간/일간 요약 데이터를 덮어씌웁니다. 스냅샷에 저장된 데이터를 기반으로 해당 연월의 요약 데이터를 재생성합니다.',
    })
    async restoreFromSnapshot(
        @Body() dto: RestoreFromSnapshotRequestDto,
        @User('id') performedBy: string,
    ): Promise<RestoreFromSnapshotResponseDto> {
        if (!performedBy) {
            throw new BadRequestException('사용자 정보를 찾을 수 없습니다.');
        }

        if (!dto.snapshotId) {
            throw new BadRequestException('스냅샷 ID는 필수입니다.');
        }

        const result = await this.attendanceDataBusinessService.스냅샷으로부터복원한다({
            snapshotId: dto.snapshotId,
            performedBy,
        });

        return {
            year: result.year,
            month: result.month,
        };
    }

    /**
     * 해당 직원 해당 연월 스냅샷 존재 여부 조회
     *
     * 근태 상세 조회와 동일한 기준으로, 해당 연월에 해당 직원에 대한 스냅샷 데이터가 있는지 여부만 반환합니다.
     */
    @Get('employees/:employeeId/snapshot-exists')
    @ApiOperation({
        summary: '직원 연월 스냅샷 존재 여부 조회',
        description:
            '해당 직원의 해당 연월에 조회되는 스냅샷 데이터가 있는지 여부를 반환합니다. 근태 상세 조회와 동일한 기준(연월·MONTHLY 타입·해당 직원 child)으로 판별합니다.',
    })
    @ApiParam({
        name: 'employeeId',
        description: '직원 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiQuery({ name: 'year', description: '연도', example: '2026', required: true })
    @ApiQuery({ name: 'month', description: '월 (01-12)', example: '01', required: true })
    @ApiResponse({
        status: 200,
        description: '스냅샷 존재 여부 조회 성공',
        type: CheckEmployeeSnapshotExistsResponseDto,
    })
    async checkEmployeeSnapshotExists(
        @Param('employeeId', ParseUUIDPipe) employeeId: string,
        @Query('year') year: string,
        @Query('month') month: string,
    ): Promise<ICheckEmployeeSnapshotExistsResponse> {
        if (!year || !month) {
            throw new BadRequestException('연도와 월은 필수입니다.');
        }

        const monthStr = typeof month === 'string' && month.length === 1 ? month.padStart(2, '0') : month;
        return await this.attendanceDataBusinessService.해당직원해당연월스냅샷존재여부를조회한다({
            employeeId,
            year,
            month: monthStr,
        });
    }

    /**
     * 스냅샷 목록 조회
     *
     * 연월을 기준으로 스냅샷 데이터를 조회합니다.
     * 기본적으로 가장 최신 스냅샷을 반환하며, 조건 변경에 유연하게 대응할 수 있도록 구성됩니다.
     */
    @Get('snapshots')
    @ApiOperation({
        summary: '스냅샷 목록 조회',
        description:
            '연월을 기준으로 스냅샷 데이터를 조회합니다. 기본적으로 가장 최신 스냅샷을 반환하며, 정렬 및 필터 조건을 통해 유연하게 조회할 수 있습니다.',
    })
    @ApiQuery({ name: 'year', description: '연도', example: '2026', required: true })
    @ApiQuery({ name: 'month', description: '월', example: '01', required: true })
    // @ApiQuery({
    //     name: 'sortBy',
    //     description: '정렬 기준',
    //     enum: ['latest', 'oldest', 'name', 'type'],
    //     example: 'latest',
    //     required: false,
    // })
    @ApiResponse({
        status: 200,
        description: '스냅샷 목록 조회 성공',
        type: GetSnapshotListResponseDto,
    })
    async getSnapshotList(@Query() dto: GetSnapshotListRequestDto): Promise<IGetSnapshotListResponse> {
        if (!dto.year || !dto.month) {
            throw new BadRequestException('연도와 월은 필수입니다.');
        }

        const result = await this.attendanceDataBusinessService.스냅샷목록을조회한다({
            year: dto.year,
            month: dto.month,
            // sortBy: dto.sortBy || 'latest',
            // filters: dto.filters,
        });

        return result;
    }

    /**
     * 스냅샷 상세 조회
     *
     * 스냅샷 ID로 스냅샷과 하위 스냅샷을 조회합니다.
     * 부서 ID를 제공하면 해당 부서의 해당 연월에 소속되었던 직원들의 스냅샷 child 데이터만 반환합니다.
     */
    @Get('snapshots/:id')
    @ApiOperation({
        summary: '스냅샷 상세 조회',
        description:
            '스냅샷 ID로 스냅샷과 하위 스냅샷을 조회합니다. 부서 ID를 제공하면 해당 부서의 해당 연월에 소속되었던 직원들의 스냅샷 child 데이터만 반환합니다.',
    })
    @ApiParam({ name: 'id', description: '스냅샷 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiQuery({
        name: 'departmentId',
        description: '부서 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: true,
    })
    @ApiResponse({
        status: 200,
        description: '스냅샷 상세 조회 성공',
    })
    async getSnapshotById(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('departmentId', ParseUUIDPipe) departmentId: string,
    ): Promise<IGetSnapshotByIdResponse> {
        if (!departmentId) {
            throw new BadRequestException('부서 ID는 필수입니다.');
        }

        const result = await this.attendanceDataBusinessService.스냅샷을ID로조회한다({
            snapshotId: id,
            departmentId,
        });

        return result;
    }

    /**
     * 월간 요약 노트 조회
     *
     * 월간 요약 ID를 기준으로 해당 월간 요약의 노트를 조회합니다.
     */
    @Get('monthly-summaries/:id/note')
    @ApiOperation({
        summary: '월간 요약 노트 조회',
        description: '월간 요약 ID를 기준으로 해당 월간 요약의 노트를 조회합니다.',
    })
    @ApiParam({ name: 'id', description: '월간 요약 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({
        status: 200,
        description: '월간 요약 노트 조회 성공',
        type: GetMonthlySummaryNoteResponseDto,
    })
    async getMonthlySummaryNote(@Param('id', ParseUUIDPipe) id: string): Promise<IGetMonthlySummaryNoteResponse> {
        const result = await this.attendanceDataBusinessService.월간요약노트를조회한다({
            monthlySummaryId: id,
        });

        return result;
    }

    /**
     * 월간 요약 노트 수정
     *
     * 월간 요약의 노트를 수정합니다.
     */
    @Patch('monthly-summaries/:id/note')
    @ApiOperation({
        summary: '월간 요약 노트 수정',
        description: '월간 요약의 노트를 수정합니다.',
    })
    @ApiParam({ name: 'id', description: '월간 요약 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({
        status: 200,
        description: '월간 요약 노트 수정 성공',
        type: UpdateMonthlySummaryNoteResponseDto,
    })
    async updateMonthlySummaryNote(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateMonthlySummaryNoteRequestDto,
        @User('id') performedBy: string,
    ): Promise<IUpdateMonthlySummaryNoteResponse> {
        if (!performedBy) {
            throw new BadRequestException('사용자 정보를 찾을 수 없습니다.');
        }

        const result = await this.attendanceDataBusinessService.월간요약노트를수정한다({
            monthlySummaryId: id,
            note: dto.note,
            performedBy,
        });

        return result;
    }
}
