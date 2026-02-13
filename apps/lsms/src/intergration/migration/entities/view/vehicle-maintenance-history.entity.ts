import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
    expression: `SELECT
    -- 자원 정보
    res."resourceId",
    res.name AS "resourceName",
    vi."vehicleInfoId",
    vi."vehicleNumber",
    
    -- 소모품 정보
    c."consumableId",
    c.name AS "consumableName",
    c."replaceCycle",
    c."notifyReplacementCycle",
    
    -- 정비 정보
    m."maintenanceId",
    m.date AS "maintenanceDate",
    m.mileage,
    m.cost,
    m."maintananceBy",
    m.images,
    m."createdAt",
    m."updatedAt",
    
    -- 담당자 정보
    e."employeeId" AS "responsibleEmployeeId",
    e.name AS "responsibleEmployeeName",
    e.department,
    e.position,
    
    -- 시간 정보
    EXTRACT(YEAR FROM CAST(m.date AS timestamp)) AS year,
    EXTRACT(MONTH FROM CAST(m.date AS timestamp)) AS month,
    m.date AS "dateStr"
FROM
    resources res
    JOIN vehicle_infos vi ON res."resourceId" = vi."resourceId"
    LEFT JOIN consumables c ON vi."vehicleInfoId" = c."vehicleInfoId"
    LEFT JOIN maintenances m ON c."consumableId" = m."consumableId"
    LEFT JOIN employees e ON m."maintananceBy"::uuid = e."employeeId"
WHERE
    res.type = 'VEHICLE'
    AND m."maintenanceId" IS NOT NULL
ORDER BY
    res."resourceId",
    CAST(m.date AS timestamp) DESC`,
})
export class VehicleMaintenanceHistory {
    @ViewColumn()
    resourceId: string;

    @ViewColumn()
    resourceName: string;

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
    maintenanceId: string;

    @ViewColumn()
    maintenanceDate: string;

    @ViewColumn()
    mileage: number;

    @ViewColumn()
    cost: number;

    @ViewColumn()
    maintananceBy: string;

    @ViewColumn()
    images: string[];

    @ViewColumn()
    createdAt: Date;

    @ViewColumn()
    updatedAt: Date;

    @ViewColumn()
    responsibleEmployeeId: string;

    @ViewColumn()
    responsibleEmployeeName: string;

    @ViewColumn()
    department: string;

    @ViewColumn()
    position: string;

    @ViewColumn()
    year: number;

    @ViewColumn()
    month: number;

    @ViewColumn()
    dateStr: string;
}
