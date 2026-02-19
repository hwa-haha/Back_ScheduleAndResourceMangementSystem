import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, BadRequestException, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UploadFileCommand } from './upload-file.command';
import { IUploadFileResponse } from '../../../interfaces';
import { DomainFileService } from '../../../../../domain/file/file.service';
import { IStorageService } from '../../../../../integrations/storage';
import { ExcelReaderService } from '../../../../../integrations/excel-reader/excel-reader.service';
import { FileType } from '../../../../../domain/file/file.types';

/**
 * 파일 업로드 핸들러
 *
 * 1. 파일 종류 검증 (엑셀 파일만 허용)
 * 2. 엑셀 파일 읽기 및 검증 (저장소에 저장하기 전에)
 *   2-1. 1행의 컬럼명에 대한 비교확인으로 검증
 *   2-2. 검증 결과로 성공/실패 구분
 *   2-3. 성공인 경우 출입기록 파일인지 근태사용내역 파일인지 구분
 * 3. 검증이 성공하면 파일을 저장소에 저장
 * 4. 파일 엔티티 생성 (저장 경로 포함, 가공한 데이터 포함)
 * 5. 검증이 실패하면 파일업로드를 중지하고 오류를 응답
 */
@CommandHandler(UploadFileCommand)
export class UploadFileHandler implements ICommandHandler<UploadFileCommand, IUploadFileResponse> {
    private readonly logger = new Logger(UploadFileHandler.name);

    // 한글-영어 컬럼명 매핑 (타입별로 분리)
    private readonly koreanToEnglish = {
        event: {
            위치: 'location',
            발생시각: 'eventTime',
            장치명: 'deviceName',
            상태: 'status',
            카드번호: 'cardNumber',
            이름: 'name',
            사원번호: 'employeeNumber',
            근무조: 'workShift',
            조직: 'department',
            직급: 'position',
            생성구분: 'eventType',
            생성시간: 'creationTime',
            생성자: 'creator',
            생성내용: 'details',
            사진유무: 'photoAvailable',
            비고: 'remarks',
            '출입(발열/마스크)': 'entryCheck',
        },
        attendance: {
            기간: 'period',
            이름: 'name',
            상태: 'status',
            신청내역: 'requestHistory',
            신청일: 'requestDate',
            사용일수: 'usedDays',
            문서번호: 'documentNumber',
            신청일수: 'requestDays',
            근태항목: 'attendanceItem',
            근태구분: 'type',
            ERP사번: 'employeeNumber',
            부서: 'department',
            종결일자: 'closingDate',
            출장지: 'businessTripLocation',
            교통수단: 'transportation',
            출장목적: 'businessTripPurpose',
            비고: 'remarks',
        },
    };

    constructor(
        @Inject('IStorageService')
        private readonly storageService: IStorageService,
        private readonly excelReaderService: ExcelReaderService,
        private readonly fileService: DomainFileService,
        private readonly dataSource: DataSource,
    ) {}

    async execute(command: UploadFileCommand): Promise<IUploadFileResponse> {
        const { file, uploadBy, year, month } = command.data;

        return await this.dataSource.transaction(async (manager) => {
            try {
                // 파일명은 컨트롤러의 FileInterceptor에서 이미 디코딩됨
                this.logger.log(`파일 업로드 시작: ${file.originalname}, 업로드자: ${uploadBy}`);

                // 1. 파일 종류 검증 (엑셀 파일만 허용)
                if (!this.isExcelFile(file)) {
                    throw new BadRequestException('엑셀 파일만 업로드 가능합니다.');
                }

                // 2. 엑셀 파일 읽기 및 검증 (저장소에 저장하기 전에)
                let rawExcelData: Record<string, any>[] = [];
                let excelData: Record<string, Record<string, any>[]> = {}; // 직원별로 그룹화된 데이터
                let fileType: string | null = null;
                let orgData: Record<string, any> | null = null;

                try {
                    // 엑셀 파일 파싱 (메모리에서 직접 읽기)
                    const excelResult = await this.excelReaderService.readWorksheet(file.buffer, {
                        hasHeader: true,
                    });

                    if (!excelResult.records) {
                        throw new BadRequestException('엑셀 파일에 헤더가 없거나 데이터를 읽을 수 없습니다.');
                    }

                    rawExcelData = excelResult.records;
                    this.logger.log(`엑셀 데이터 읽기 완료: ${rawExcelData.length}행`);

                    // 2-1. 1행의 컬럼명 검증
                    if (rawExcelData.length === 0) {
                        throw new BadRequestException('엑셀 파일에 데이터가 없습니다.');
                    }

                    // 첫 번째 행의 키를 컬럼명으로 사용
                    const firstRow = rawExcelData[0];
                    const columnNames = excelResult.headers;

                    // 필수 컬럼명 검증 및 파일 타입 구분
                    const validationResult = this.validateAndDetermineFileType(columnNames);
                    if (!validationResult.isValid) {
                        const requiredColumns = this.getRequiredColumns();
                        throw new BadRequestException(
                            `엑셀 파일의 컬럼명 형식이 올바르지 않습니다.\n\n` +
                                `[출입 이벤트 형식 필수 컬럼]\n${requiredColumns.event.join(', ')}\n\n` +
                                `[근태 사용 내역 형식 필수 컬럼]\n${requiredColumns.attendance.join(', ')}`,
                        );
                    }

                    // 2-3. 파일 타입 구분
                    fileType = validationResult.fileType!;
                    this.logger.log(`컬럼명 검증 완료: ${rawExcelData.length}행, 파일 타입: ${fileType}`);

                    // 엑셀 데이터를 영문 키값으로 재구성 (매핑된 키값만 저장)
                    const mapping =
                        fileType === FileType.EVENT_HISTORY
                            ? this.koreanToEnglish.event
                            : this.koreanToEnglish.attendance;

                    const reconstructedData = this.reconstructDataWithEnglishKeys(rawExcelData, mapping);

                    // 업로드 대상 연월과 데이터 내 연월이 다르면 오류
                    this.validateYearMonth(fileType, reconstructedData, Number(year), Number(month));

                    // 직원별로 구분 (employeeNumber가 있는 경우만)
                    excelData = this.groupByEmployee(reconstructedData);

                    // 조직/부서 정보 구성
                    orgData = this.buildOrgData(reconstructedData);

                    // 2-2. 검증 성공
                } catch (error) {
                    // 2-2. 검증 실패
                    this.logger.error(`엑셀 파일 검증 실패: ${error.message}`, error.stack);
                    throw error;
                }

                // 3. 검증이 성공하면 파일을 저장소에 저장
                const uploadResult = await this.storageService.uploadExcel(file, {
                    fileName: file.originalname,
                    folder: 'attendance-excel',
                    metadata: {
                        year,
                        month,
                        uploadBy,
                        fileType: fileType || 'unknown',
                    },
                });

                this.logger.log(`파일 S3 업로드 완료: ${uploadResult.fileKey}`);

                // 4. 파일 엔티티 생성 (저장 경로 포함, 가공한 데이터 포함)
                const refactoringFile = await this.fileService.생성한다(
                    {
                        fileName: uploadResult.fileKey,
                        filePath: uploadResult.url || uploadResult.fileKey,
                        fileOriginalName: file.originalname, // 컨트롤러에서 이미 디코딩된 파일명
                        fileType: fileType as FileType,
                        uploadBy,
                        year,
                        month,
                        data: excelData,
                        orgData: orgData ?? null,
                    },
                    manager,
                );

                this.logger.log(`✅ 파일 업로드 처리 완료: ${refactoringFile.id}`);

                return {
                    fileId: refactoringFile.id,
                    fileName: refactoringFile.fileName,
                    filePath: refactoringFile.filePath,
                    year,
                    month,
                };
            } catch (error) {
                this.logger.error(`파일 업로드 처리 실패: ${error.message}`, error.stack);
                if (error instanceof BadRequestException) {
                    throw error;
                }
                throw new BadRequestException(`파일 업로드 중 오류가 발생했습니다: ${error.message}`);
            }
        });
    }

    /**
     * 엑셀 파일 여부 확인
     */
    private isExcelFile(file: Express.Multer.File): boolean {
        const excelExtensions = ['.xlsx', '.xls', '.csv'];
        const fileName = file.originalname.toLowerCase();
        return excelExtensions.some((ext) => fileName.endsWith(ext));
    }

    /**
     * 컬럼명 검증 및 파일 타입 구분
     */
    private validateAndDetermineFileType(columnNames: string[]): {
        isValid: boolean;
        fileType: string | null;
    } {
        const requiredColumns = this.getRequiredColumns();

        // 출입 이벤트 형식 검증
        const isEventFormat = requiredColumns.event.every((col) =>
            columnNames.some((name) => name.toLowerCase().includes(col.toLowerCase())),
        );

        // 근태 사용 내역 형식 검증
        const isAttendanceFormat = requiredColumns.attendance.every((col) =>
            columnNames.some((name) => name.toLowerCase().includes(col.toLowerCase())),
        );

        if (isEventFormat) {
            return {
                isValid: true,
                fileType: FileType.EVENT_HISTORY,
            };
        }

        if (isAttendanceFormat) {
            return {
                isValid: true,
                fileType: FileType.ATTENDANCE_DATA,
            };
        }

        return {
            isValid: false,
            fileType: null,
        };
    }

    /**
     * 필수 컬럼명 목록
     *
     * 각 파일 타입별로 필수 컬럼명을 정의합니다.
     * 엑셀 파일의 컬럼명이 이 중 하나라도 포함되어 있으면 해당 타입으로 인식됩니다.
     */
    private getRequiredColumns(): { event: string[]; attendance: string[] } {
        return {
            // 출입 이벤트 형식 필수 컬럼 (koreanToEnglish의 출입 이벤트 키값들)
            event: Object.keys(this.koreanToEnglish.event),
            // 근태 사용 내역 형식 필수 컬럼 (koreanToEnglish의 근태 키값들)
            attendance: Object.keys(this.koreanToEnglish.attendance),
        };
    }

    /**
     * 엑셀 데이터를 영문 키값으로 재구성
     * 매핑에 정의된 키값만 저장합니다.
     */
    private reconstructDataWithEnglishKeys(
        excelData: Record<string, any>[],
        mapping: Record<string, string>,
    ): Record<string, any>[] {
        return excelData.map((row) => {
            const reconstructedRow: Record<string, any> = {};

            // 매핑에 정의된 키값만 저장
            Object.keys(mapping).forEach((koreanKey) => {
                // 원본 데이터에서 일치하는 한글 키 찾기 (부분 일치 포함)
                const matchedOriginalKey = Object.keys(row).find(
                    (originalKey) =>
                        originalKey.toLowerCase().includes(koreanKey.toLowerCase()) ||
                        koreanKey.toLowerCase().includes(originalKey.toLowerCase()),
                );

                if (matchedOriginalKey) {
                    const englishKey = mapping[koreanKey];
                    reconstructedRow[englishKey] = row[matchedOriginalKey];
                }
            });

            return reconstructedRow;
        });
    }

    /**
     * 업로드 대상 연월(year, month)과 데이터 내 연월이 다른 행이 있으면 BadRequestException 발생
     * - event: 발생시각(eventTime) 기준 연월 검사 (예: 2025-12-01 05:57:34)
     * - attendance: 기간(period)의 시작일 기준 연월 검사 (예: 2025-12-30 ~ 2026-01-12 → 2025-12)
     */
    private validateYearMonth(
        fileType: string,
        data: Record<string, any>[],
        targetYear: number,
        targetMonth: number,
    ): void {
        const y = Number(targetYear);
        const m = Number(targetMonth);
        if (Number.isNaN(y) || Number.isNaN(m) || m < 1 || m > 12) {
            throw new BadRequestException('업로드 대상 연월이 올바르지 않습니다.');
        }

        if (fileType === FileType.EVENT_HISTORY) {
            // "2025-12-01 05:57:34" 또는 "2025-12-01T05:57:34" 형식 파싱. new Date()만 쓰면 2025-11-31 같은 잘못된 날짜가 12/1로 넘어가므로, 연·월·일을 추출해 유효성 검사 후 사용
            const eventTimeRegex = /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/;
            for (let i = 0; i < data.length; i++) {
                const eventTime = data[i].eventTime;
                if (eventTime == null || eventTime === '') continue;
                const str = String(eventTime).trim();
                const match = str.match(eventTimeRegex);
                if (!match) {
                    throw new BadRequestException(
                        `${i + 2}행: 발생시각 형식이 올바르지 않습니다. (예: 2025-12-01 05:57:34)`,
                    );
                }
                const parsedYear = parseInt(match[1], 10);
                const parsedMonth = parseInt(match[2], 10);
                const parsedDay = parseInt(match[3], 10);
                const h = parseInt(match[4], 10);
                const min = parseInt(match[5], 10);
                const sec = parseInt(match[6], 10);
                // 월(1-12) → 0-based, 로컬 기준으로 생성해 잘못된 날짜(예: 11-31)가 넘어가지 않았는지 확인
                const date = new Date(parsedYear, parsedMonth - 1, parsedDay, h, min, sec);
                if (
                    date.getFullYear() !== parsedYear ||
                    date.getMonth() + 1 !== parsedMonth ||
                    date.getDate() !== parsedDay
                ) {
                    throw new BadRequestException(
                        `${i + 2}행: 발생시각의 날짜가 유효하지 않습니다. (${parsedYear}-${String(parsedMonth).padStart(2, '0')}-${String(parsedDay).padStart(2, '0')} — 해당 월의 일 수를 확인하세요)`,
                    );
                }
                if (parsedYear !== y || parsedMonth !== m) {
                    throw new BadRequestException(
                        `${i + 2}행: 발생시각의 연월(${parsedYear}-${String(parsedMonth).padStart(2, '0')})이 업로드 대상 연월(${y}-${String(m).padStart(2, '0')})과 다릅니다.`,
                    );
                }
            }
            return;
        }

        if (fileType === FileType.ATTENDANCE_DATA) {
            // 기간에서 시작일·종료일 추출 (예: 2025-12-30 ~ 2026-01-12)
            const periodDateRegex = /\d{4}-\d{2}-\d{2}/g;
            for (let i = 0; i < data.length; i++) {
                const period = data[i].period;
                if (period == null || period === '') continue;
                const str = String(period).trim();
                const matches = str.match(periodDateRegex);
                if (!matches || matches.length < 1) {
                    throw new BadRequestException(
                        `${i + 2}행: 기간 형식이 올바르지 않습니다. (예: 2025-12-30 ~ 2026-01-12)`,
                    );
                }
                const startDateStr = matches[0];
                const endDateStr = matches.length >= 2 ? matches[1] : matches[0];
                const startDate = new Date(startDateStr);
                const endDate = new Date(endDateStr);
                if (Number.isNaN(startDate.getTime())) {
                    throw new BadRequestException(`${i + 2}행: 기간의 시작일을 해석할 수 없습니다. (${startDateStr})`);
                }
                if (Number.isNaN(endDate.getTime())) {
                    throw new BadRequestException(`${i + 2}행: 기간의 종료일을 해석할 수 없습니다. (${endDateStr})`);
                }
                const startInTarget = startDate.getFullYear() === y && startDate.getMonth() + 1 === m;
                const endInTarget = endDate.getFullYear() === y && endDate.getMonth() + 1 === m;
                if (!startInTarget && !endInTarget) {
                    throw new BadRequestException(
                        `${i + 2}행: 기간(${startDateStr} ~ ${endDateStr})이 업로드 대상 연월(${y}-${String(m).padStart(2, '0')})에 전혀 걸쳐 있지 않습니다. 시작일 또는 종료일 중 하나라도 해당 연월에 포함되어야 합니다.`,
                    );
                }
            }
        }
    }

    /**
     * 직원별로 데이터 그룹화
     * employeeNumber가 없는 경우는 저장하지 않습니다.
     */
    private groupByEmployee(excelData: Record<string, any>[]): Record<string, Record<string, any>[]> {
        const grouped: Record<string, Record<string, any>[]> = {};

        excelData.forEach((row) => {
            // employeeNumber가 필수 (없으면 저장하지 않음)
            const employeeIdentifier = row.employeeNumber;

            if (employeeIdentifier) {
                if (!grouped[employeeIdentifier]) {
                    grouped[employeeIdentifier] = [];
                }
                grouped[employeeIdentifier].push(row);
            }
        });

        return grouped;
    }

    /**
     * 조직/부서 정보 구성
     *
     * koreanToEnglish 매핑 결과를 기준으로 부서별로 그룹핑하고,
     * 각 부서 그룹 안에 직원 정보를 하나씩만 저장합니다.
     */
    private buildOrgData(excelData: Record<string, any>[]): Record<string, any> | null {
        const departments: Record<
            string,
            Array<{ employeeNumber: string; name: string | null; position: string | null }>
        > = {};
        const employeeInDepartment: Record<string, Set<string>> = {}; // 부서별로 이미 추가된 직원번호 추적

        excelData.forEach((row) => {
            const employeeNumber = row.employeeNumber;
            const department = row.department;
            if (!employeeNumber || !department) {
                return;
            }

            // 부서별로 그룹핑
            if (!departments[department]) {
                departments[department] = [];
                employeeInDepartment[department] = new Set();
            }

            // 같은 부서 내에서 같은 직원번호가 이미 추가되었는지 확인
            if (!employeeInDepartment[department].has(employeeNumber)) {
                departments[department].push({
                    employeeNumber,
                    name: row.name ?? null,
                    position: row.position ?? null,
                });
                employeeInDepartment[department].add(employeeNumber);
            }
        });

        if (Object.keys(departments).length === 0) {
            return null;
        }

        return departments;
    }
}
