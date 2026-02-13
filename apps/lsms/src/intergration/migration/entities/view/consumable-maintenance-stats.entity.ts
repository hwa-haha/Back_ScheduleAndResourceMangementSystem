import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
    expression: `SELECT
    -- 자원 정보
    res."resourceId",
    res.name AS "resourceName",
    res.type AS "resourceType",
    
    -- 차량 정보
    vi."vehicleInfoId",
    vi."vehicleNumber",
    
    -- 소모품 정보
    c."consumableId",
    c.name AS "consumableName",
    c."replaceCycle",
    c."notifyReplacementCycle",
    
    -- 정비 통계
    COUNT(m."maintenanceId") AS "maintenanceCount",
    MIN(CAST(m.date AS timestamp)) AS "firstMaintenanceDate",
    MAX(CAST(m.date AS timestamp)) AS "lastMaintenanceDate",
    SUM(m.cost) AS "totalCost",
    AVG(m.cost) AS "averageCost",
    
    -- 마일리지 통계
    MIN(m.mileage) AS "minMileage",
    MAX(m.mileage) AS "maxMileage",
    AVG(m.mileage) AS "averageMileage",
    
    -- 정비 주기 분석
    (MAX(CAST(m.date AS timestamp)) - MIN(CAST(m.date AS timestamp))) / 
        NULLIF(COUNT(m."maintenanceId") - 1, 0) AS "averageDaysBetweenMaintenances",
    
    -- 년/월별 집계를 위한 필드
    EXTRACT(YEAR FROM NOW()) AS "currentYear",
    EXTRACT(MONTH FROM NOW()) AS "currentMonth",
    
    -- 최근 3개월 내 정비 횟수
    COUNT(CASE WHEN CAST(m.date AS timestamp) > NOW() - INTERVAL '3 months' THEN m."maintenanceId" END) AS "recentMaintenanceCount",
    
    -- 집계 시점
    NOW() AS "computedAt"
FROM
    resources res
    JOIN vehicle_infos vi ON res."resourceId" = vi."resourceId"
    JOIN consumables c ON vi."vehicleInfoId" = c."vehicleInfoId"
    LEFT JOIN maintenances m ON c."consumableId" = m."consumableId"
WHERE
    res.type = 'VEHICLE'
GROUP BY
    res."resourceId",
    res.name,
    res.type,
    vi."vehicleInfoId",
    vi."vehicleNumber",
    c."consumableId",
    c.name,
    c."replaceCycle",
    c."notifyReplacementCycle"
ORDER BY
    "resourceName",
    "consumableName"`,
})
export class ConsumableMaintenanceStats {
    @ViewColumn()
    resourceId: string;

    @ViewColumn()
    resourceName: string;

    @ViewColumn()
    resourceType: string;

    @ViewColumn()
    vehicleInfoId: string;

    @ViewColumn()
    vehicleNumber: string;

    @ViewColumn()
    consumableId: string;

    @ViewColumn()
    consumableName: string;

    @ViewColumn()
    replaceCycle: number;

    @ViewColumn()
    notifyReplacementCycle: boolean;

    @ViewColumn()
    maintenanceCount: number;

    @ViewColumn()
    firstMaintenanceDate: Date;

    @ViewColumn()
    lastMaintenanceDate: Date;

    @ViewColumn()
    totalCost: number;

    @ViewColumn()
    averageCost: number;

    @ViewColumn()
    minMileage: number;

    @ViewColumn()
    maxMileage: number;

    @ViewColumn()
    averageMileage: number;

    @ViewColumn()
    averageDaysBetweenMaintenances: number;

    @ViewColumn()
    currentYear: number;

    @ViewColumn()
    currentMonth: number;

    @ViewColumn()
    recentMaintenanceCount: number;

    @ViewColumn()
    computedAt: Date;
}
