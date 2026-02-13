import { ViewEntity, ViewColumn, Connection } from 'typeorm';

@ViewEntity({
    expression: `SELECT
    -- 시간 기준
    EXTRACT(YEAR FROM r."startDate") AS year,
    EXTRACT(MONTH FROM r."startDate") AS month,
    TO_CHAR(r."startDate", 'YYYY-MM') AS "yearMonth",
    
    -- 직원 정보
    rp."employeeId",
    e.name AS "employeeName",
    
    -- 예약 통계
    COUNT(DISTINCT r."reservationId") AS "reservationCount",
    SUM(EXTRACT(EPOCH FROM (r."endDate" - r."startDate"))/3600) AS "totalHours",
    AVG(EXTRACT(EPOCH FROM (r."endDate" - r."startDate"))/3600) AS "avgHoursPerReservation",
    
    -- 자원 유형별 예약 횟수
    COUNT(DISTINCT CASE WHEN res.type = 'VEHICLE' THEN r."reservationId" END) AS "vehicleCount",
    COUNT(DISTINCT CASE WHEN res.type = 'MEETING_ROOM' THEN r."reservationId" END) AS "meetingRoomCount",
    COUNT(DISTINCT CASE WHEN res.type = 'ACCOMMODATION' THEN r."reservationId" END) AS "accommodationCount",

    -- 취소 및 변경 빈도
    COUNT(DISTINCT CASE WHEN r.status = 'CANCELLED' THEN r."reservationId" END) AS "cancellationCount",
    
    -- 가장 많이 예약한 자원 (서브쿼리로 처리해야 할 수 있음)
    -- 복잡한 구현은 애플리케이션 코드에서 처리 가능
    
    -- 집계 시점
    NOW() AS "computedAt"
FROM 
    reservations r
    JOIN reservation_participants rp ON r."reservationId" = rp."reservationId"
    JOIN resources res ON r."resourceId" = res."resourceId"
    JOIN employees e ON rp."employeeId" = e."employeeId"
WHERE
    rp.type = 'RESERVER'
GROUP BY
    EXTRACT(YEAR FROM r."startDate"),
    EXTRACT(MONTH FROM r."startDate"),
    TO_CHAR(r."startDate", 'YYYY-MM'),
    rp."employeeId",
    e.name`,
})
export class EmployeeReservationStats {
    @ViewColumn()
    year: number;

    @ViewColumn()
    month: number;

    @ViewColumn()
    yearMonth: string;

    @ViewColumn()
    employeeId: string;

    @ViewColumn()
    employeeName: string;

    // @ViewColumn()
    // employeeEmail: string;

    @ViewColumn()
    reservationCount: number;

    @ViewColumn()
    totalHours: number;

    @ViewColumn()
    avgHoursPerReservation: number;

    @ViewColumn()
    vehicleCount: number;

    @ViewColumn()
    meetingRoomCount: number;

    @ViewColumn()
    accommodationCount: number;

    @ViewColumn()
    cancellationCount: number;

    @ViewColumn()
    computedAt: Date;
}
