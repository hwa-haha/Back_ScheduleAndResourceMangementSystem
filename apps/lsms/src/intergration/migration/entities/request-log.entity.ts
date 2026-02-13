import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum Environment {
    LOCAL = 'LOCAL',
    DEV = 'DEV',
    PROD = 'PROD',
}

@Entity({ name: 'request_logs' })
export class RequestLog {
    @PrimaryGeneratedColumn('uuid')
    requestLogId: string;

    @CreateDateColumn({
        type: 'timestamptz',
        comment: '요청 시간',
    })
    requestTime: Date;

    @Column({
        type: 'varchar',
        length: 10,
        comment: 'HTTP 메소드 (GET, POST, PUT, DELETE 등)',
    })
    method: string;

    @Column({
        type: 'varchar',
        length: 500,
        comment: '요청 엔드포인트 URL',
    })
    endpoint: string;

    @Column({
        type: 'text',
        nullable: true,
        comment: '요청 바디 (JSON 문자열)',
    })
    requestBody?: string;

    @Column({
        type: 'text',
        nullable: true,
        comment: '요청 파라미터 (JSON 문자열)',
    })
    requestParams?: string;

    @Column({
        type: 'text',
        nullable: true,
        comment: '요청 헤더 (JSON 문자열)',
    })
    requestHeaders?: string;

    @Column({
        type: 'text',
        nullable: true,
        comment: '응답 바디 (JSON 문자열)',
    })
    responseBody?: string;

    @Column({
        type: 'int',
        comment: 'HTTP 상태 코드',
    })
    statusCode: number;

    @Column({
        type: 'text',
        nullable: true,
        comment: '오류 메시지',
    })
    errorMessage?: string;

    @Column({
        type: 'text',
        nullable: true,
        comment: '오류 스택 트레이스',
    })
    errorStack?: string;

    @Column({
        type: 'enum',
        enum: Environment,
        comment: '환경 (LOCAL, DEV, PROD)',
    })
    environment: Environment;

    @Column({
        type: 'varchar',
        length: 100,
        nullable: true,
        comment: '요청자 이름',
    })
    employeeName?: string;

    @Column({
        type: 'varchar',
        length: 50,
        nullable: true,
        comment: '요청자 직원 ID',
    })
    employeeId?: string;

    @Column({
        type: 'varchar',
        length: 500,
        nullable: true,
        comment: 'User-Agent 정보',
    })
    userAgent?: string;

    @Column({
        type: 'varchar',
        length: 45,
        nullable: true,
        comment: '클라이언트 IP 주소',
    })
    ipAddress?: string;

    @Column({
        type: 'int',
        nullable: true,
        comment: '요청 처리 시간 (밀리초)',
    })
    duration?: number;

    @Column({
        type: 'varchar',
        length: 100,
        nullable: true,
        comment: '요청 고유 ID (트레이싱용)',
    })
    traceId?: string;
}
