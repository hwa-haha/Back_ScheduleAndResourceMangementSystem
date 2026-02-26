import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateRequestLogTable1756192500000 implements MigrationInterface {
    name = 'CreateRequestLogTable1756192500000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // uuid-ossp 확장 활성화 (uuid_generate_v4() 함수 사용을 위해)
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // request_logs 테이블 생성
        await queryRunner.createTable(
            new Table({
                name: 'request_logs',
                columns: [
                    {
                        name: 'requestLogId',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                        comment: '요청 로그 고유 ID',
                    },
                    {
                        name: 'requestTime',
                        type: 'timestamptz',
                        default: 'CURRENT_TIMESTAMP',
                        comment: '요청 시간',
                    },
                    {
                        name: 'method',
                        type: 'varchar',
                        length: '10',
                        comment: 'HTTP 메소드 (GET, POST, PUT, DELETE 등)',
                    },
                    {
                        name: 'endpoint',
                        type: 'varchar',
                        length: '500',
                        comment: '요청 엔드포인트 URL',
                    },
                    {
                        name: 'requestBody',
                        type: 'text',
                        isNullable: true,
                        comment: '요청 바디 (JSON 문자열)',
                    },
                    {
                        name: 'requestParams',
                        type: 'text',
                        isNullable: true,
                        comment: '요청 파라미터 (JSON 문자열)',
                    },
                    {
                        name: 'requestHeaders',
                        type: 'text',
                        isNullable: true,
                        comment: '요청 헤더 (JSON 문자열)',
                    },
                    {
                        name: 'responseBody',
                        type: 'text',
                        isNullable: true,
                        comment: '응답 바디 (JSON 문자열)',
                    },
                    {
                        name: 'statusCode',
                        type: 'int',
                        comment: 'HTTP 상태 코드',
                    },
                    {
                        name: 'errorMessage',
                        type: 'text',
                        isNullable: true,
                        comment: '오류 메시지',
                    },
                    {
                        name: 'errorStack',
                        type: 'text',
                        isNullable: true,
                        comment: '오류 스택 트레이스',
                    },
                    {
                        name: 'environment',
                        type: 'enum',
                        enum: ['LOCAL', 'DEV', 'PROD'],
                        comment: '환경 (LOCAL, DEV, PROD)',
                    },
                    {
                        name: 'employeeName',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                        comment: '요청자 이름',
                    },
                    {
                        name: 'employeeId',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                        comment: '요청자 직원 ID',
                    },
                    {
                        name: 'userAgent',
                        type: 'varchar',
                        length: '500',
                        isNullable: true,
                        comment: 'User-Agent 정보',
                    },
                    {
                        name: 'ipAddress',
                        type: 'varchar',
                        length: '45',
                        isNullable: true,
                        comment: '클라이언트 IP 주소',
                    },
                    {
                        name: 'duration',
                        type: 'int',
                        isNullable: true,
                        comment: '요청 처리 시간 (밀리초)',
                    },
                    {
                        name: 'traceId',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                        comment: '요청 고유 ID (트레이싱용)',
                    },
                ],
            }),
            true,
        );

        // 인덱스 생성 (성능 최적화)
        await queryRunner.createIndex(
            'request_logs',
            new TableIndex({
                name: 'IDX_request_logs_request_time',
                columnNames: ['requestTime'],
            }),
        );

        await queryRunner.createIndex(
            'request_logs',
            new TableIndex({
                name: 'IDX_request_logs_employee_id',
                columnNames: ['employeeId'],
            }),
        );

        await queryRunner.createIndex(
            'request_logs',
            new TableIndex({
                name: 'IDX_request_logs_environment',
                columnNames: ['environment'],
            }),
        );

        await queryRunner.createIndex(
            'request_logs',
            new TableIndex({
                name: 'IDX_request_logs_status_code',
                columnNames: ['statusCode'],
            }),
        );

        await queryRunner.createIndex(
            'request_logs',
            new TableIndex({
                name: 'IDX_request_logs_method_endpoint',
                columnNames: ['method', 'endpoint'],
            }),
        );

        await queryRunner.createIndex(
            'request_logs',
            new TableIndex({
                name: 'IDX_request_logs_trace_id',
                columnNames: ['traceId'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 인덱스 삭제
        await queryRunner.dropIndex('request_logs', 'IDX_request_logs_trace_id');
        await queryRunner.dropIndex('request_logs', 'IDX_request_logs_method_endpoint');
        await queryRunner.dropIndex('request_logs', 'IDX_request_logs_status_code');
        await queryRunner.dropIndex('request_logs', 'IDX_request_logs_environment');
        await queryRunner.dropIndex('request_logs', 'IDX_request_logs_employee_id');
        await queryRunner.dropIndex('request_logs', 'IDX_request_logs_request_time');

        // 테이블 삭제
        await queryRunner.dropTable('request_logs');
    }
}
