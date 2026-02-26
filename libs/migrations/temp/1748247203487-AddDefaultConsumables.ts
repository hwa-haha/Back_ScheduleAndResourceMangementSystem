import { MigrationInterface, QueryRunner } from 'typeorm';

const DEFAULT_CONSUMABLES = [
    { name: '엔진오일', replaceCycle: 5000 },
    { name: '에어컨 가스 점검 및 보충', replaceCycle: 20000 },
    { name: '공기청정기 필터', replaceCycle: 20000 },
    { name: '에어컨(히터) 에어필터 - 전, 후', replaceCycle: 12000 },
    { name: '타이어 위치 교환', replaceCycle: 10000 },
    { name: '컴퓨터 진단기 종합점검', replaceCycle: 10000 },
    { name: '브레이크 패드 & 라이닝 - 전', replaceCycle: 20000 },
    { name: '연료필터-RV, 소형', replaceCycle: 30000 },
    { name: '자동변속기 오일', replaceCycle: 20000 },
    { name: '브레이크 오일', replaceCycle: 40000 },
    { name: '수동변속기 오일', replaceCycle: 40000 },
    { name: '클러치 오일', replaceCycle: 40000 },
    { name: '디퍼런셜 오일', replaceCycle: 40000 },
    { name: '타이어 상태점검 및 교환', replaceCycle: 40000 },
    { name: '파워스티어링 오일', replaceCycle: 40000 },
    { name: '브레이크 패드 & 라이닝 - 후', replaceCycle: 40000 },
    { name: '배터리', replaceCycle: 50000 },
    { name: '연료필터 - 승용', replaceCycle: 60000 },
    { name: '에일필터 - 디젤', replaceCycle: 40000 },
    { name: '점화플러그 & 케이블 - 일반', replaceCycle: 40000 },
    { name: '점화플러그 & 케이블 - 백금', replaceCycle: 60000 },
    { name: '부동액', replaceCycle: 40000 },
    { name: '외부벨트 세트', replaceCycle: 40000 },
    { name: '타이밍벨트 세트 & 워터펌프', replaceCycle: 70000 },
    { name: '디퍼렌셜 오일 - 전, 후', replaceCycle: 40000 },
    { name: '산소센서', replaceCycle: 80000 },
    { name: '캐니스터', replaceCycle: 80000 },
    { name: '각종 램프류 점등상태 및 조정', replaceCycle: 0 },
    { name: '휠 밸런스 & 얼라이먼트', replaceCycle: 0 },
];

export class AddDefaultConsumables1748247203487 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 소모품이 없는 차량 정보 조회
        const vehicleInfos = await queryRunner.query(`
            SELECT vi."vehicleInfoId", vi."totalMileage"
            FROM vehicle_infos vi
            LEFT JOIN consumables c ON c."vehicleInfoId" = vi."vehicleInfoId" AND c."deletedAt" IS NULL
            WHERE c."consumableId" IS NULL
        `);

        // 각 차량 정보에 기본 소모품 추가
        for (const vehicleInfo of vehicleInfos) {
            const values = DEFAULT_CONSUMABLES.map((consumable) => ({
                vehicleInfoId: vehicleInfo.vehicleInfoId,
                name: consumable.name,
                replaceCycle: consumable.replaceCycle,
                notifyReplacementCycle: true,
                initMileage: vehicleInfo.totalMileage || 0,
            }));

            await queryRunner.query(
                `
                INSERT INTO consumables (
                    "consumableId",
                    "vehicleInfoId",
                    name,
                    "replaceCycle",
                    "notifyReplacementCycle",
                    "initMileage",
                    "deletedAt"
                )
                SELECT 
                    gen_random_uuid(),
                    unnest($1::uuid[]),
                    unnest($2::text[]),
                    unnest($3::integer[]),
                    unnest($4::boolean[]),
                    unnest($5::integer[]),
                    NULL
                `,
                [
                    values.map((v) => v.vehicleInfoId),
                    values.map((v) => v.name),
                    values.map((v) => v.replaceCycle),
                    values.map((v) => v.notifyReplacementCycle),
                    values.map((v) => v.initMileage),
                ],
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 롤백 로직은 구현하지 않음 (기본 소모품 삭제는 위험할 수 있음)
    }
}
