import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DomainAttendanceTypeService } from '../../domain/attendance-type/attendance-type.service';
import { DomainHolidayInfoService } from '../../domain/holiday-info/holiday-info.service';
import { DomainProjectService } from '../../domain/project/project.service';
import { DomainEmployeeExtraInfoService } from '../../domain/employee-extra-info/employee-extra-info.service';
import { OrganizationMigrationService } from '../migration/migration.service';
import { UploadFileHandler } from '../../context/file-management-context/handlers/file-upload/commands/upload-file.handler';
import { UploadFileCommand } from '../../context/file-management-context/handlers/file-upload/commands/upload-file.command';
import { DomainFileService } from '../../domain/file/file.service';
import { AttendanceType } from '../../domain/attendance-type/attendance-type.entity';
import { HolidayInfo } from '../../domain/holiday-info/holiday-info.entity';
import { Project } from '../../domain/project/project.entity';
import { EmployeeExtraInfo } from '../../domain/employee-extra-info/employee-extra-info.entity';
import { Employee } from '@libs/modules/employee/employee.entity';
import { IsNull } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 기본 데이터 초기화 서비스
 *
 * 애플리케이션 시작 시 필수 기본 데이터가 없으면 자동으로 생성합니다.
 * - 근태 유형 (AttendanceType): 연차, 반차, 출장, 병가, 경조사 등
 * - 휴일 정보 (HolidayInfo): 공휴일 정보
 * - 직원 추가 정보 (EmployeeExtraInfo): 직원별 추가정보 레코드
 */
@Injectable()
export class InitService implements OnApplicationBootstrap {
    private readonly logger = new Logger(InitService.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly attendanceTypeService: DomainAttendanceTypeService,
        private readonly holidayInfoService: DomainHolidayInfoService,
        private readonly projectService: DomainProjectService,
        private readonly employeeExtraInfoService: DomainEmployeeExtraInfoService,
        private readonly organizationMigrationService: OrganizationMigrationService,
        private readonly uploadFileHandler: UploadFileHandler,
        private readonly fileService: DomainFileService,
    ) {}

    async onApplicationBootstrap(): Promise<void> {
        try {
            this.logger.log('기본 데이터 초기화 시작...');

            // 데이터베이스 연결 확인
            if (!this.dataSource.isInitialized) {
                await this.dataSource.initialize();
            }

            // 1. 근태 유형 기본 데이터 생성
            await this.근태유형기본데이터생성();

            // 2. 휴일 정보 기본 데이터 생성
            await this.휴일정보기본데이터생성();

            // 3. 프로젝트 기본 데이터 생성
            await this.프로젝트기본데이터생성();

            // 4. 조직 데이터 마이그레이션(동기화) — SSO 데이터 기준 존재 시 업데이트, 없으면 삽입
            // await this.조직데이터마이그레이션();

            // 5. 직원 추가정보 기본 데이터 생성 (추가정보 없는 직원에 대해 레코드 생성)
            await this.직원추가정보기본데이터생성();

            // 6. 초기 파일 업로드 (2026년 1월 더미 데이터)
            await this.초기파일업로드();

            this.logger.log('✅ 기본 데이터 초기화 완료');
        } catch (error) {
            this.logger.error(`기본 데이터 초기화 실패: ${error.message}`, error.stack);
            // 초기화 오류는 애플리케이션 시작을 막지 않습니다
        }
    }

    /**
     * 근태 유형 기본 데이터를 생성한다
     */
    private async 근태유형기본데이터생성(): Promise<void> {
        this.logger.log('근태 유형 기본 데이터 확인 중...');

        const defaultAttendanceTypes = [
            {
                title: '연차',
                workTime: 480,
                isRecognizedWorkTime: true,
                startWorkTime: '09:00',
                endWorkTime: '18:00',
                deductedAnnualLeave: 1.0,
            },
            {
                title: '오전반차',
                workTime: 240,
                isRecognizedWorkTime: true,
                startWorkTime: '09:00',
                endWorkTime: '14:00',
                deductedAnnualLeave: 0.5,
            },
            {
                title: '오후반차',
                workTime: 240,
                isRecognizedWorkTime: true,
                startWorkTime: '14:00',
                endWorkTime: '18:00',
                deductedAnnualLeave: 0.5,
            },
            {
                title: '공가',
                workTime: 480,
                isRecognizedWorkTime: true,
                startWorkTime: '09:00',
                endWorkTime: '18:00',
                deductedAnnualLeave: 0.0,
            },
            {
                title: '오전공가',
                workTime: 240,
                isRecognizedWorkTime: true,
                startWorkTime: '09:00',
                endWorkTime: '14:00',
                deductedAnnualLeave: 0.0,
            },
            {
                title: '오후공가',
                workTime: 240,
                isRecognizedWorkTime: true,
                startWorkTime: '14:00',
                endWorkTime: '18:00',
                deductedAnnualLeave: 0.0,
            },
            {
                title: '출장',
                workTime: 480,
                isRecognizedWorkTime: true,
                startWorkTime: '09:00',
                endWorkTime: '18:00',
                deductedAnnualLeave: 0.0,
            },
            {
                title: '오전출장',
                workTime: 240,
                isRecognizedWorkTime: true,
                startWorkTime: '09:00',
                endWorkTime: '14:00',
                deductedAnnualLeave: 0.0,
            },
            {
                title: '오후출장',
                workTime: 240,
                isRecognizedWorkTime: true,
                startWorkTime: '14:00',
                endWorkTime: '18:00',
                deductedAnnualLeave: 0.0,
            },
            {
                title: '교육',
                workTime: 480,
                isRecognizedWorkTime: true,
                startWorkTime: '09:00',
                endWorkTime: '18:00',
                deductedAnnualLeave: 0.0,
            },
            {
                title: '오전교육',
                workTime: 240,
                isRecognizedWorkTime: true,
                startWorkTime: '09:00',
                endWorkTime: '14:00',
                deductedAnnualLeave: 0.0,
            },
            {
                title: '오후교육',
                workTime: 240,
                isRecognizedWorkTime: true,
                startWorkTime: '14:00',
                endWorkTime: '18:00',
                deductedAnnualLeave: 0.0,
            },
            {
                title: '경조휴가',
                workTime: 480,
                isRecognizedWorkTime: true,
                startWorkTime: '09:00',
                endWorkTime: '18:00',
                deductedAnnualLeave: 0.0,
            },
            {
                title: '보건휴가(오전 반차)',
                workTime: 240,
                isRecognizedWorkTime: true,
                startWorkTime: '09:00',
                endWorkTime: '14:00',
                deductedAnnualLeave: 0.0,
            },
            {
                title: '병가',
                workTime: 480,
                isRecognizedWorkTime: true,
                startWorkTime: '09:00',
                endWorkTime: '18:00',
                deductedAnnualLeave: 0.0,
            },
            {
                title: '생일오전반차',
                workTime: 240,
                isRecognizedWorkTime: true,
                startWorkTime: '09:00',
                endWorkTime: '14:00',
                deductedAnnualLeave: 0.5,
            },
            {
                title: '생일오후반차',
                workTime: 240,
                isRecognizedWorkTime: true,
                startWorkTime: '14:00',
                endWorkTime: '18:00',
                deductedAnnualLeave: 0.5,
            },
            {
                title: '대체휴가',
                workTime: 480,
                isRecognizedWorkTime: true,
                startWorkTime: '09:00',
                endWorkTime: '18:00',
                deductedAnnualLeave: 0.0,
            },
            {
                title: '오전대체휴가',
                workTime: 240,
                isRecognizedWorkTime: true,
                startWorkTime: '09:00',
                endWorkTime: '14:00',
                deductedAnnualLeave: 0.0,
            },
            {
                title: '오후대체휴가',
                workTime: 240,
                isRecognizedWorkTime: true,
                startWorkTime: '14:00',
                endWorkTime: '18:00',
                deductedAnnualLeave: 0.0,
            },
            {
                title: '무급휴가',
                workTime: 0,
                isRecognizedWorkTime: true,
                startWorkTime: '09:00',
                endWorkTime: '18:00',
                deductedAnnualLeave: 0.0,
            },
            {
                title: '보건휴가(오전반차)',
                workTime: 240,
                isRecognizedWorkTime: true,
                startWorkTime: '09:00',
                endWorkTime: '14:00',
                deductedAnnualLeave: 0.0,
            },
            {
                title: '국내출장',
                workTime: 480,
                isRecognizedWorkTime: true,
                startWorkTime: '09:00',
                endWorkTime: '18:00',
                deductedAnnualLeave: 0.0,
            },
            {
                title: '국외출장',
                workTime: 480,
                isRecognizedWorkTime: true,
                startWorkTime: '09:00',
                endWorkTime: '18:00',
                deductedAnnualLeave: 0.0,
            },
            {
                title: '사외교육',
                workTime: 480,
                isRecognizedWorkTime: true,
                startWorkTime: '09:00',
                endWorkTime: '18:00',
                deductedAnnualLeave: 0.0,
            },
            {
                title: '사내교육',
                workTime: 480,
                isRecognizedWorkTime: true,
                startWorkTime: '09:00',
                endWorkTime: '18:00',
                deductedAnnualLeave: 0.0,
            },
        ];

        const existingTypes = await this.dataSource.manager.find(AttendanceType, {
            where: { deleted_at: IsNull() },
        });
        const existingTitles = new Set(existingTypes.map((at) => at.title));

        let createdCount = 0;
        for (const typeData of defaultAttendanceTypes) {
            if (existingTitles.has(typeData.title)) {
                this.logger.log(`근태 유형 "${typeData.title}"이 이미 존재합니다.`);
                continue;
            }

            try {
                await this.attendanceTypeService.생성한다({
                    title: typeData.title,
                    workTime: typeData.workTime,
                    isRecognizedWorkTime: typeData.isRecognizedWorkTime,
                    startWorkTime: typeData.startWorkTime,
                    endWorkTime: typeData.endWorkTime,
                    deductedAnnualLeave: typeData.deductedAnnualLeave,
                });
                createdCount++;
                this.logger.log(`근태 유형 "${typeData.title}" 생성 완료`);
            } catch (error) {
                this.logger.warn(`근태 유형 "${typeData.title}" 생성 실패: ${error.message}`);
            }
        }

        if (createdCount > 0) {
            this.logger.log(`근태 유형 기본 데이터 생성 완료: ${createdCount}개 생성됨`);
        } else {
            this.logger.log('근태 유형 기본 데이터가 모두 존재합니다.');
        }
    }

    /**
     * 휴일 정보 기본 데이터를 생성한다
     */
    private async 휴일정보기본데이터생성(): Promise<void> {
        this.logger.log('휴일 정보 기본 데이터 확인 중...');

        const defaultHolidays = [
            { holidayName: '1월1일', holidayDate: '2024-01-01' },
            { holidayName: '설날', holidayDate: '2024-02-09' },
            { holidayName: '설날', holidayDate: '2024-02-10' },
            { holidayName: '설날', holidayDate: '2024-02-11' },
            { holidayName: '대체공휴일(설날)', holidayDate: '2024-02-12' },
            { holidayName: '삼일절', holidayDate: '2024-03-01' },
            { holidayName: '국회의원선거', holidayDate: '2024-04-10' },
            { holidayName: '어린이날', holidayDate: '2024-05-05' },
            { holidayName: '대체공휴일(어린이날)', holidayDate: '2024-05-06' },
            { holidayName: '부처님오신날', holidayDate: '2024-05-15' },
            { holidayName: '현충일', holidayDate: '2024-06-06' },
            { holidayName: '광복절', holidayDate: '2024-08-15' },
            { holidayName: '추석', holidayDate: '2024-09-16' },
            { holidayName: '추석', holidayDate: '2024-09-17' },
            { holidayName: '추석', holidayDate: '2024-09-18' },
            { holidayName: '임시공휴일', holidayDate: '2024-10-01' },
            { holidayName: '개천절', holidayDate: '2024-10-03' },
            { holidayName: '한글날', holidayDate: '2024-10-09' },
            { holidayName: '기독탄신일', holidayDate: '2024-12-25' },
            { holidayName: '1월1일', holidayDate: '2025-01-01' },
            { holidayName: '임시공휴일(설날)', holidayDate: '2025-01-27' },
            { holidayName: '설날', holidayDate: '2025-01-28' },
            { holidayName: '설날', holidayDate: '2025-01-29' },
            { holidayName: '설날', holidayDate: '2025-01-30' },
            { holidayName: '삼일절', holidayDate: '2025-03-01' },
            { holidayName: '대체공휴일(삼일절)', holidayDate: '2025-03-03' },
            { holidayName: '어린이날', holidayDate: '2025-05-05' },
            { holidayName: '부처님오신날', holidayDate: '2025-05-05' },
            { holidayName: '대체공휴일(부처님오신날)', holidayDate: '2025-05-06' },
            { holidayName: '현충일', holidayDate: '2025-06-06' },
            { holidayName: '임시공휴일(대통령선거)', holidayDate: '2025-06-03' },
            { holidayName: '광복절', holidayDate: '2025-08-15' },
            { holidayName: '추석', holidayDate: '2025-10-05' },
            { holidayName: '추석', holidayDate: '2025-10-06' },
            { holidayName: '추석', holidayDate: '2025-10-07' },
            { holidayName: '임시공휴일(추석)', holidayDate: '2025-10-08' },
            { holidayName: '개천절', holidayDate: '2025-10-03' },
            { holidayName: '한글날', holidayDate: '2025-10-09' },
            { holidayName: '전사휴무(연차소진)', holidayDate: '2025-10-10' },
            { holidayName: '기독탄신일', holidayDate: '2025-12-25' },
            { holidayName: '1월1일', holidayDate: '2026-01-01' },
            { holidayName: '설날', holidayDate: '2026-02-16' },
            { holidayName: '설날', holidayDate: '2026-02-17' },
            { holidayName: '설날', holidayDate: '2026-02-18' },
            { holidayName: '삼일절', holidayDate: '2026-03-01' },
            { holidayName: '대체공휴일(삼일절)', holidayDate: '2026-03-02' },
            { holidayName: '어린이날', holidayDate: '2026-05-05' },
            { holidayName: '부처님오신날', holidayDate: '2026-05-24' },
            { holidayName: '대체공휴일(부처님오신날)', holidayDate: '2026-05-25' },
            { holidayName: '전국동시지방선거', holidayDate: '2026-06-03' },
            { holidayName: '현충일', holidayDate: '2026-06-06' },
            { holidayName: '광복절', holidayDate: '2026-08-15' },
            { holidayName: '대체공휴일(광복절)', holidayDate: '2026-08-17' },
            { holidayName: '추석', holidayDate: '2026-09-24' },
            { holidayName: '추석', holidayDate: '2026-09-25' },
            { holidayName: '추석', holidayDate: '2026-09-26' },
            { holidayName: '개천절', holidayDate: '2026-10-03' },
            { holidayName: '대체공휴일(개천절)', holidayDate: '2026-10-05' },
            { holidayName: '한글날', holidayDate: '2026-10-09' },
            { holidayName: '기독탄신일', holidayDate: '2026-12-25' },
        ];

        const existingHolidays = await this.dataSource.manager.find(HolidayInfo, {
            where: { deleted_at: IsNull() },
        });
        const existingHolidayMap = new Map<string, boolean>();
        existingHolidays.forEach((h) => {
            const key = `${h.holiday_date}_${h.holiday_name}`;
            existingHolidayMap.set(key, true);
        });

        let createdCount = 0;
        for (const holidayData of defaultHolidays) {
            const key = `${holidayData.holidayDate}_${holidayData.holidayName}`;
            if (existingHolidayMap.has(key)) {
                this.logger.log(
                    `휴일 정보 "${holidayData.holidayName} (${holidayData.holidayDate})"이 이미 존재합니다.`,
                );
                continue;
            }

            try {
                await this.holidayInfoService.생성한다({
                    holidayName: holidayData.holidayName,
                    holidayDate: holidayData.holidayDate,
                });
                createdCount++;
                this.logger.log(`휴일 정보 "${holidayData.holidayName} (${holidayData.holidayDate})" 생성 완료`);
            } catch (error) {
                this.logger.warn(
                    `휴일 정보 "${holidayData.holidayName} (${holidayData.holidayDate})" 생성 실패: ${error.message}`,
                );
            }
        }

        if (createdCount > 0) {
            this.logger.log(`휴일 정보 기본 데이터 생성 완료: ${createdCount}개 생성됨`);
        } else {
            this.logger.log('휴일 정보 기본 데이터가 모두 존재합니다.');
        }
    }

    /**
     * 프로젝트 기본 데이터를 생성한다
     */
    private async 프로젝트기본데이터생성(): Promise<void> {
        this.logger.log('프로젝트 기본 데이터 확인 중...');

        const defaultProjects = [
            {
                projectCode: 'EDUCATION',
                projectName: '교육',
                description: '교육 프로젝트',
            },
            {
                projectCode: 'LEAVE',
                projectName: '휴가',
                description: '휴가 프로젝트',
            },
            {
                projectCode: 'SSX1_SDIP',
                projectName: 'SSX1.SDIP',
                description: 'SSX1.SDIP 프로젝트',
            },
            {
                projectCode: 'SSX2_DEV',
                projectName: 'SSX2.개발',
                description: 'SSX2.개발 프로젝트',
            },
            {
                projectCode: 'SSX3_OPS',
                projectName: 'SSX3.운영',
                description: 'SSX3.운영 프로젝트',
            },
        ];

        const existingProjects = await this.dataSource.manager.find(Project, {
            where: { deleted_at: IsNull() },
        });
        const existingCodes = new Set(existingProjects.map((p) => p.project_code));

        let createdCount = 0;
        for (const projectData of defaultProjects) {
            if (existingCodes.has(projectData.projectCode)) {
                this.logger.log(
                    `프로젝트 "${projectData.projectName} (${projectData.projectCode})"이 이미 존재합니다.`,
                );
                continue;
            }

            try {
                await this.projectService.생성한다({
                    projectCode: projectData.projectCode,
                    projectName: projectData.projectName,
                    description: projectData.description,
                    isActive: true,
                });
                createdCount++;
                this.logger.log(`프로젝트 "${projectData.projectName} (${projectData.projectCode})" 생성 완료`);
            } catch (error) {
                this.logger.warn(
                    `프로젝트 "${projectData.projectName} (${projectData.projectCode})" 생성 실패: ${error.message}`,
                );
            }
        }

        if (createdCount > 0) {
            this.logger.log(`프로젝트 기본 데이터 생성 완료: ${createdCount}개 생성됨`);
        } else {
            this.logger.log('프로젝트 기본 데이터가 모두 존재합니다.');
        }
    }

    /**
     * 직원 추가정보 기본 데이터를 생성한다
     * 추가정보(EmployeeExtraInfo)가 없는 모든 직원에 대해 is_excluded_from_summary=false 로 생성한다.
     */
    private async 직원추가정보기본데이터생성(): Promise<void> {
        this.logger.log('직원 추가정보 기본 데이터 확인 중...');

        const employees = await this.dataSource.manager.find(Employee);
        if (employees.length === 0) {
            this.logger.log('직원이 없어 직원 추가정보 초기화를 건너뜁니다.');
            return;
        }

        const existingExtraInfos = await this.dataSource.manager.find(EmployeeExtraInfo, {
            where: { deleted_at: IsNull() },
        });
        const employeeIdsWithExtraInfo = new Set(existingExtraInfos.map((eei) => eei.employee_id));

        let createdCount = 0;
        for (const emp of employees) {
            if (employeeIdsWithExtraInfo.has(emp.id)) {
                continue;
            }
            try {
                await this.employeeExtraInfoService.생성한다({
                    employeeId: emp.id,
                    isExcludedFromSummary: false,
                });
                employeeIdsWithExtraInfo.add(emp.id);
                createdCount++;
            } catch (error) {
                this.logger.warn(`직원 추가정보 생성 실패 (employeeId: ${emp.id}): ${error.message}`);
            }
        }

        if (createdCount > 0) {
            this.logger.log(`직원 추가정보 기본 데이터 생성 완료: ${createdCount}개 생성됨`);
        } else {
            this.logger.log('직원 추가정보가 모두 존재합니다.');
        }
    }

    /**
     * 조직 데이터 마이그레이션(동기화)을 실행한다
     * SSO에서 데이터를 가져와 기존 레코드는 업데이트, 없으면 삽입합니다.
     * 매 부팅 시 실행되어 SSO와 로컬 DB를 동기화합니다.
     */
    private async 조직데이터마이그레이션(): Promise<void> {
        this.logger.log('조직 데이터 마이그레이션(동기화) 실행 중...');

        try {
            const result = await this.organizationMigrationService.마이그레이션한다({
                includeTerminated: true,
                includeInactiveDepartments: true,
            });
            this.logger.log(
                `✅ 조직 데이터 마이그레이션 완료: 직급 ${result.statistics.ranks}개, 직책 ${result.statistics.positions}개, 부서 ${result.statistics.departments}개, 부서이력 ${result.statistics.departmentHistories}건, 직원 ${result.statistics.employees}명`,
            );
        } catch (error) {
            this.logger.error(`조직 데이터 마이그레이션 실패: ${error.message}`, error.stack);
            // 마이그레이션 실패는 애플리케이션 시작을 막지 않습니다
        }
    }

    /**
     * 초기 파일을 업로드한다
     *
     * 2026년 1월 더미 데이터 파일들을 업로드합니다.
     * - 출입내역_2026년1월.xlsx
     * - 근태신청내역_2026년1월.xlsx
     */
    private async 초기파일업로드(): Promise<void> {
        this.logger.log('초기 파일 업로드 확인 중...');

        try {
            // 프로젝트 루트 경로 (빌드 환경과 소스 환경 모두 지원)
            // __dirname이 dist 폴더에 있을 수도 있으므로 process.cwd() 사용
            const projectRoot = process.cwd();
            const storagePath = path.join(projectRoot, 'storage', 'local-files');

            // 초기 파일 체크 (하나의 파일만 체크)
            const INITIAL_FILE_NAME = '출입내역_2026년1월.xlsx';
            const INITIAL_YEAR = '2026';
            const INITIAL_MONTH = '01';

            const existingFiles = await this.fileService.연도월별목록조회한다(INITIAL_YEAR, INITIAL_MONTH);
            const existingNames = new Set(existingFiles.map((f) => f.fileOriginalName ?? f.fileName).filter(Boolean));
            if (existingNames.has(INITIAL_FILE_NAME)) {
                this.logger.log(`초기 파일이 이미 업로드되어 있습니다 (${INITIAL_FILE_NAME}). 업로드를 건너뜁니다.`);
                return;
            }

            // storage 폴더에서 파일 목록 동적으로 생성
            const filesToUpload = this.업로드파일목록을생성한다(storagePath);

            for (const fileInfo of filesToUpload) {
                // 파일 존재 여부 확인
                if (!fs.existsSync(fileInfo.filePath)) {
                    this.logger.warn(`파일이 존재하지 않습니다: ${fileInfo.filePath}`);
                    continue;
                }

                try {
                    // 파일 읽기
                    const fileBuffer = fs.readFileSync(fileInfo.filePath);
                    const stats = fs.statSync(fileInfo.filePath);

                    // Express.Multer.File 형태로 변환
                    const multerFile: Express.Multer.File = {
                        fieldname: 'file',
                        originalname: fileInfo.fileName,
                        encoding: '7bit',
                        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        size: stats.size,
                        buffer: fileBuffer,
                        destination: '',
                        filename: fileInfo.fileName,
                        path: fileInfo.filePath,
                        stream: null as any,
                    };

                    // 파일 업로드 (핸들러 직접 실행)
                    await this.uploadFileHandler.execute(
                        new UploadFileCommand({
                            file: multerFile,
                            uploadBy: 'system',
                            year: fileInfo.year,
                            month: fileInfo.month,
                        }),
                    );

                    this.logger.log(`✅ 파일 업로드 완료: ${fileInfo.fileName}`);
                } catch (error) {
                    this.logger.warn(`파일 업로드 실패 (${fileInfo.fileName}): ${error.message}`);
                    // 파일 업로드 실패는 애플리케이션 시작을 막지 않습니다
                }
            }
        } catch (error) {
            this.logger.warn(`초기 파일 업로드 중 오류 발생: ${error.message}`);
            // 파일 업로드 실패는 애플리케이션 시작을 막지 않습니다
        }
    }

    /**
     * storage 폴더에서 업로드할 파일 목록을 동적으로 생성한다
     *
     * 파일명 패턴: (출입내역|근태신청내역)_YYYY년M월.xlsx
     * 예: 출입내역_2025년3월.xlsx, 근태신청내역_2026년1월.xlsx
     */
    private 업로드파일목록을생성한다(storagePath: string): Array<{
        filePath: string;
        fileName: string;
        year: string;
        month: string;
    }> {
        const filesToUpload: Array<{
            filePath: string;
            fileName: string;
            year: string;
            month: string;
        }> = [];

        // storage 폴더가 존재하지 않으면 빈 배열 반환
        if (!fs.existsSync(storagePath)) {
            this.logger.warn(`storage 폴더가 존재하지 않습니다: ${storagePath}`);
            return filesToUpload;
        }

        // 파일 목록 읽기
        const files = fs.readdirSync(storagePath);

        // 파일명 패턴: (출입내역|근태신청내역)_(\d{4})년(\d{1,2})월\.xlsx
        const filePattern = /^(출입내역|근태신청내역)_(\d{4})년(\d{1,2})월\.xlsx$/;

        // 월 이름을 숫자로 매핑
        const monthMap: Record<string, string> = {
            '1월': '01',
            '2월': '02',
            '3월': '03',
            '4월': '04',
            '5월': '05',
            '6월': '06',
            '7월': '07',
            '8월': '08',
            '9월': '09',
            '10월': '10',
            '11월': '11',
            '12월': '12',
        };

        for (const fileName of files) {
            // .xlsx 파일만 처리
            if (!fileName.endsWith('.xlsx')) {
                continue;
            }

            // 파일명 패턴 매칭
            const match = fileName.match(filePattern);
            if (!match) {
                continue;
            }

            const [, , year, monthNumStr] = match;
            const monthKey = `${monthNumStr}월`;
            const month = monthMap[monthKey];

            if (!month) {
                this.logger.warn(`알 수 없는 월 형식: ${fileName} (월: ${monthKey})`);
                continue;
            }

            const filePath = path.join(storagePath, fileName);
            filesToUpload.push({
                filePath,
                fileName,
                year,
                month,
            });
        }

        // 연도와 월 순서로 정렬
        filesToUpload.sort((a, b) => {
            const yearCompare = a.year.localeCompare(b.year);
            if (yearCompare !== 0) return yearCompare;
            return a.month.localeCompare(b.month);
        });

        this.logger.log(`업로드할 파일 목록 생성 완료: ${filesToUpload.length}개 파일`);
        return filesToUpload;
    }
}
