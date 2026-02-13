import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
    expression: `SELECT
    -- 자원 정보
    res."resourceId",
    res.name AS "resourceName",
    res.type AS "resourceType",
    
    -- 직원 정보
    rp."employeeId",
    e.name AS "employeeName",
    
    -- 시간 기준
    EXTRACT(YEAR FROM r."startDate") AS year,
    EXTRACT(MONTH FROM r."startDate") AS month,
    TO_CHAR(r."startDate", 'YYYY-MM') AS "yearMonth",
    
    -- 이용 통계
    COUNT(DISTINCT r."reservationId") AS "reservationCount",
    SUM(EXTRACT(EPOCH FROM (r."endDate" - r."startDate"))/3600) AS "totalHours",
    
    -- 순위 계산 (동일 자원에 대한 직원별 예약 횟수 순위)
    RANK() OVER (
        PARTITION BY res."resourceId", EXTRACT(YEAR FROM r."startDate"), EXTRACT(MONTH FROM r."startDate")
        ORDER BY COUNT(DISTINCT r."reservationId") DESC
    ) AS "countRank",
    
    -- 시간 기준 순위 계산
    RANK() OVER (
        PARTITION BY res."resourceId", EXTRACT(YEAR FROM r."startDate"), EXTRACT(MONTH FROM r."startDate")
        ORDER BY SUM(EXTRACT(EPOCH FROM (r."endDate" - r."startDate"))/3600) DESC
    ) AS "hoursRank",
    
    -- 집계 시점
    NOW() AS "computedAt"
FROM 
    reservations r
    JOIN reservation_participants rp ON r."reservationId" = rp."reservationId"
    JOIN resources res ON r."resourceId" = res."resourceId"
    JOIN employees e ON rp."employeeId" = e."employeeId"
WHERE
    rp.type = 'RESERVER' -- 예약 주체만 집계
    AND r.status <> 'CANCELLED' -- 취소된 예약 제외
GROUP BY
    res."resourceId",
    res.name,
    res.type,
    rp."employeeId",
    e.name,
    EXTRACT(YEAR FROM r."startDate"),
    EXTRACT(MONTH FROM r."startDate"),
    TO_CHAR(r."startDate", 'YYYY-MM')
ORDER BY
    res."resourceId",
    year,
    month,
    "reservationCount" DESC,
    "totalHours" DESC`,
})
export class ResourceUsageStats {
    @ViewColumn()
    resourceId: string;

    @ViewColumn()
    resourceName: string;

    @ViewColumn()
    resourceType: string;

    @ViewColumn()
    employeeId: string;

    @ViewColumn()
    employeeName: string;

    @ViewColumn()
    year: number;

    @ViewColumn()
    month: number;

    @ViewColumn()
    yearMonth: string;

    @ViewColumn()
    reservationCount: number;

    @ViewColumn()
    totalHours: number;

    @ViewColumn()
    countRank: number;

    @ViewColumn()
    hoursRank: number;

    @ViewColumn()
    computedAt: Date;
}
