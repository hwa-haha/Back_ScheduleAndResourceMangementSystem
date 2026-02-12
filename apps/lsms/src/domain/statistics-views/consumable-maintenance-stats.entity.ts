import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
    expression: `SELECT
    res."resourceId",
    res.name AS "resourceName",
    res.type AS "resourceType",
    vi."vehicleInfoId",
    vi."vehicleNumber",
    c."consumableId",
    c.name AS "consumableName",
    c."replaceCycle",
    c."notifyReplacementCycle",
    COUNT(m."maintenanceId") AS "maintenanceCount",
    MIN(CAST(m.date AS timestamp)) AS "firstMaintenanceDate",
    MAX(CAST(m.date AS timestamp)) AS "lastMaintenanceDate",
    SUM(m.cost) AS "totalCost",
    AVG(m.cost) AS "averageCost",
    MIN(m.mileage) AS "minMileage",
    MAX(m.mileage) AS "maxMileage",
    AVG(m.mileage) AS "averageMileage",
    (MAX(CAST(m.date AS timestamp)) - MIN(CAST(m.date AS timestamp))) / 
        NULLIF(COUNT(m."maintenanceId") - 1, 0) AS "averageDaysBetweenMaintenances",
    EXTRACT(YEAR FROM NOW()) AS "currentYear",
    EXTRACT(MONTH FROM NOW()) AS "currentMonth",
    COUNT(CASE WHEN CAST(m.date AS timestamp) > NOW() - INTERVAL '3 months' THEN m."maintenanceId" END) AS "recentMaintenanceCount",
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
