import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import {
    ReadExcelOptionsDto,
    ExcelFileInfoDto,
    ExcelDataResultDto,
    WorksheetInfoDto,
    CellValidationRule,
    ValidationResultDto,
} from './dtos/read-excel.dto';
import { DEFAULT_READ_OPTIONS, MAX_ROWS } from './excel-reader.constants';

/** 저장용 표준 날짜/시간 형식: YYYY-MM-DD HH:mm:ss */
const STANDARD_DATETIME_FORMAT = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/;

/** 날짜/시간 형식으로 보이는 문자열인지 (카드번호·사원번호 등 숫자만 있는 값 제외) */
function looksLikeDateString(value: string): boolean {
    return /[-/\s:]/.test(value);
}

/**
 * Date 객체를 YYYY-MM-DD HH:mm:ss 형식 문자열로 변환
 */
function formatDateToStandard(value: Date): string {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    const hh = String(value.getHours()).padStart(2, '0');
    const mm = String(value.getMinutes()).padStart(2, '0');
    const ss = String(value.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

/**
 * 레코드 배열 내 날짜 값을 YYYY-MM-DD HH:mm:ss 형식으로 정규화 (엑셀 로케일 형식 방지)
 */
function normalizeDateValuesInRecords(records: Record<string, any>[]): void {
    for (const record of records) {
        for (const key of Object.keys(record)) {
            const value = record[key];
            if (value instanceof Date) {
                record[key] = formatDateToStandard(value);
            } else if (
                typeof value === 'string' &&
                looksLikeDateString(value) &&
                !STANDARD_DATETIME_FORMAT.test(value) &&
                !Number.isNaN(Date.parse(value))
            ) {
                // 날짜처럼 보이는 문자열만 표준 형식으로 변환 (d/m/yy h:mm 등). 숫자만 있는 값(카드번호·사원번호)은 제외
                try {
                    const parsed = new Date(value);
                    if (!Number.isNaN(parsed.getTime())) {
                        record[key] = formatDateToStandard(parsed);
                    }
                } catch {
                    // 파싱 실패 시 그대로 유지
                }
            }
        }
    }
}

/**
 * 엑셀 리더 서비스
 *
 * XLSX 라이브러리를 사용하여 엑셀 파일을 읽고 파싱하는 기능을 제공합니다.
 */
@Injectable()
export class ExcelReaderService {
    private readonly logger = new Logger(ExcelReaderService.name);

    /**
     * 버퍼에서 워크북 로드
     *
     * @param buffer 파일 버퍼
     * @returns XLSX Workbook
     */
    loadWorkbook(buffer: Buffer): XLSX.WorkBook {
        try {
            this.logger.log(`워크북 로드 시작, 버퍼 크기: ${buffer.length} bytes`);

            const workbook = XLSX.read(buffer, {
                type: 'buffer',
                cellDates: true, // 날짜 셀을 Date 객체로 파싱 (d/m/yy 등 로케일 형식 방지)
            });

            this.logger.log(`워크북 로드 완료, 워크시트 수: ${workbook.SheetNames.length}`);

            // 워크북 검증
            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                throw new BadRequestException('엑셀 파일에 워크시트가 없습니다.');
            }

            return workbook;
        } catch (error) {
            this.logger.error('워크북 로드 실패');
            this.logger.error(`에러 메시지: ${error.message}`);
            if (error.stack) {
                this.logger.error(`에러 스택: ${error.stack}`);
            }

            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new BadRequestException('엑셀 파일을 읽을 수 없습니다. 파일이 손상되었거나 올바른 형식이 아닙니다.');
        }
    }

    /**
     * 엑셀 파일 정보 조회
     *
     * @param buffer 파일 버퍼
     * @returns 파일 정보
     */
    async getFileInfo(buffer: Buffer): Promise<ExcelFileInfoDto> {
        const workbook = this.loadWorkbook(buffer);

        const worksheets: WorksheetInfoDto[] = workbook.SheetNames.map((sheetName, index) => {
            const sheet = workbook.Sheets[sheetName];
            const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');

            return {
                name: sheetName,
                index,
                rowCount: range.e.r + 1, // 끝 행 + 1
                columnCount: range.e.c + 1, // 끝 열 + 1
                state: 'visible',
            };
        });

        return {
            worksheets,
            worksheetCount: worksheets.length,
            format: 'xlsx',
        };
    }

    /**
     * 워크시트 데이터 읽기
     *
     * @param buffer 파일 버퍼
     * @param options 읽기 옵션
     * @returns 워크시트 데이터
     */
    async readWorksheet(buffer: Buffer, options?: ReadExcelOptionsDto): Promise<ExcelDataResultDto> {
        const workbook = this.loadWorkbook(buffer);

        // 옵션 기본값 설정
        const readOptions = {
            ...DEFAULT_READ_OPTIONS,
            ...options,
        };

        // 워크시트 선택
        let sheetName: string;
        let worksheet: XLSX.WorkSheet;

        if (options?.sheetName) {
            sheetName = options.sheetName;
            worksheet = workbook.Sheets[sheetName];
            if (!worksheet) {
                throw new BadRequestException(`워크시트 '${options.sheetName}'을(를) 찾을 수 없습니다.`);
            }
        } else if (options?.sheetIndex !== undefined) {
            sheetName = workbook.SheetNames[options.sheetIndex];
            if (!sheetName) {
                throw new BadRequestException(`워크시트 인덱스 ${options.sheetIndex}을(를) 찾을 수 없습니다.`);
            }
            worksheet = workbook.Sheets[sheetName];
        } else {
            sheetName = workbook.SheetNames[0];
            worksheet = workbook.Sheets[sheetName];
            if (!worksheet) {
                throw new BadRequestException('워크시트가 없습니다.');
            }
        }

        this.logger.log(`워크시트 읽기: ${sheetName}`);

        // 범위 확인
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const startRow = (readOptions.startRow || 1) - 1; // 0-based
        let endRow = readOptions.endRow ? readOptions.endRow - 1 : range.e.r;

        // 최대 행 수 제한
        if (endRow - startRow > MAX_ROWS) {
            this.logger.warn(`요청된 행 수가 너무 많습니다. 최대 ${MAX_ROWS}행으로 제한합니다.`);
            endRow = startRow + MAX_ROWS;
        }

        // 데이터를 JSON으로 변환 (raw: true로 Date 객체 수신 후 정규화)
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
            header: readOptions.hasHeader ? undefined : 1,
            range: startRow,
            defval: readOptions.includeEmpty ? null : undefined,
            raw: true, // 날짜 셀은 cellDates로 Date 객체가 됨 → 정규화 단계에서 YYYY-MM-DD HH:mm:ss로 변환
        });

        // 요청된 범위만큼 데이터 자르기
        const limitedData = jsonData.slice(0, Math.min(jsonData.length, endRow - startRow + 1));
        // 헤더 추출 및 데이터 구조화
        let headers: string[] | undefined;
        let rows: any[][];
        let records: Record<string, any>[] | undefined;

        if (readOptions.hasHeader && limitedData.length > 0) {
            // 헤더가 있는 경우
            headers = Object.keys(limitedData[0]);
            records = limitedData;
            // 엑셀 로케일 형식(d/m/yy h:mm 등) 방지: Date·날짜 문자열을 YYYY-MM-DD HH:mm:ss로 정규화
            normalizeDateValuesInRecords(records);
            rows = records.map((record) => headers!.map((header) => record[header]));
        } else {
            // 헤더가 없는 경우 (배열의 배열)
            rows = limitedData;
            if (rows.length > 0 && Array.isArray(rows[0])) {
                headers = rows[0].map((_, index) => `Column${index + 1}`);
            }
        }

        const sheetIndex = workbook.SheetNames.indexOf(sheetName);

        this.logger.log(`워크시트 읽기 완료: ${sheetName} (${rows.length}행, ${headers?.length || 0}열)`);

        return {
            sheetName,
            headers,
            data: rows,
            records,
            rowCount: rows.length,
            columnCount: headers?.length || rows[0]?.length || 0,
        };
    }

    /**
     * 여러 워크시트 동시 읽기
     *
     * @param buffer 파일 버퍼
     * @param sheetNames 읽을 워크시트 이름 목록 (없으면 전체)
     * @param options 읽기 옵션
     * @returns 워크시트별 데이터
     */
    async readMultipleWorksheets(
        buffer: Buffer,
        sheetNames?: string[],
        options?: ReadExcelOptionsDto,
    ): Promise<ExcelDataResultDto[]> {
        const workbook = this.loadWorkbook(buffer);

        const results: ExcelDataResultDto[] = [];

        if (sheetNames && sheetNames.length > 0) {
            // 지정된 워크시트만 읽기
            for (const sheetName of sheetNames) {
                const result = await this.readWorksheet(buffer, {
                    ...options,
                    sheetName,
                });
                results.push(result);
            }
        } else {
            // 모든 워크시트 읽기
            for (let i = 0; i < workbook.SheetNames.length; i++) {
                const result = await this.readWorksheet(buffer, {
                    ...options,
                    sheetIndex: i,
                });
                results.push(result);
            }
        }

        return results;
    }

    /**
     * 데이터 유효성 검증
     *
     * @param data 엑셀 데이터
     * @param rules 검증 규칙
     * @returns 검증 결과
     */
    validateData(data: ExcelDataResultDto, rules: CellValidationRule[]): ValidationResultDto {
        const errors: ValidationResultDto['errors'] = [];
        const warnings: ValidationResultDto['warnings'] = [];

        if (!data.records && !data.headers) {
            throw new BadRequestException('헤더가 있는 데이터만 검증할 수 있습니다.');
        }

        data.records?.forEach((record, rowIndex) => {
            rules.forEach((rule) => {
                const columnName = typeof rule.column === 'string' ? rule.column : data.headers![rule.column];
                const value = record[columnName];

                // 필수 검증
                if (rule.required && (value === null || value === undefined || value === '')) {
                    errors.push({
                        row: rowIndex + 2, // 헤더 + 1
                        column: columnName,
                        value,
                        message: `필수 값입니다.`,
                    });
                    return;
                }

                // 타입 검증
                if (rule.type && value !== null && value !== undefined && value !== '') {
                    const isValid = this.validateType(value, rule.type);
                    if (!isValid) {
                        errors.push({
                            row: rowIndex + 2,
                            column: columnName,
                            value,
                            message: `타입이 ${rule.type}이어야 합니다.`,
                        });
                    }
                }

                // 패턴 검증
                if (rule.pattern && value) {
                    const regex = new RegExp(rule.pattern);
                    if (!regex.test(String(value))) {
                        errors.push({
                            row: rowIndex + 2,
                            column: columnName,
                            value,
                            message: `패턴이 일치하지 않습니다.`,
                        });
                    }
                }

                // 최소값 검증
                if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
                    errors.push({
                        row: rowIndex + 2,
                        column: columnName,
                        value,
                        message: `${rule.min} 이상이어야 합니다.`,
                    });
                }

                // 최대값 검증
                if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
                    errors.push({
                        row: rowIndex + 2,
                        column: columnName,
                        value,
                        message: `${rule.max} 이하여야 합니다.`,
                    });
                }
            });
        });

        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }

    /**
     * CSV로 변환
     *
     * @param data 엑셀 데이터
     * @returns CSV 문자열
     */
    async convertToCSV(data: ExcelDataResultDto): Promise<string> {
        const rows: string[][] = [];

        // 헤더 추가
        if (data.headers) {
            rows.push(data.headers);
        }

        // 데이터 추가
        data.data.forEach((row) => {
            rows.push(row.map((cell) => (cell === null || cell === undefined ? '' : String(cell))));
        });

        // CSV 문자열 생성
        return rows.map((row) => row.map((cell) => this.escapeCSVCell(cell)).join(',')).join('\n');
    }

    /**
     * 파일 경로로부터 엑셀 읽기 (호환성 메서드)
     *
     * @param filePath 파일 경로
     * @returns JSON 데이터
     */
    readFileAsJson(filePath: string): any[] {
        const workbook = XLSX.readFile(filePath);

        if (workbook.SheetNames.length === 0) {
            throw new BadRequestException('엑셀 파일이 비어있습니다.');
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        if (!sheet) {
            throw new BadRequestException('엑셀 시트가 존재하지 않습니다.');
        }

        return XLSX.utils.sheet_to_json(sheet);
    }

    /**
     * 파일 경로로부터 엑셀 읽기 (별칭)
     *
     * @param filePath 파일 경로
     * @returns JSON 데이터
     */
    findExcelFile(filePath: string): any[] {
        return this.readFileAsJson(filePath);
    }

    /**
     * 타입 검증 헬퍼
     */
    private validateType(value: any, type: string): boolean {
        switch (type) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'date':
                return value instanceof Date || !isNaN(Date.parse(value));
            default:
                return true;
        }
    }

    /**
     * CSV 셀 이스케이프
     */
    private escapeCSVCell(cell: string): string {
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
    }
}
