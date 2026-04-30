/**
 * 조직 도메인(직급·직책·부서·직원·직원-부서-직책) 로컬 시드용 고정 UUID
 * 같은 ID로 멱등 삽입(이미 있으면 스킵)
 */
export const 조직시드직급Id = {
    사원: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
    대리: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000002',
    과장: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000003',
} as const;

export const 조직시드직책Id = {
    직원: 'bbbbbbbb-bbbb-4bbb-8bbb-000000000001',
    팀장: 'bbbbbbbb-bbbb-4bbb-8bbb-000000000002',
    부서장: 'bbbbbbbb-bbbb-4bbb-8bbb-000000000003',
} as const;

export const 조직시드부서Id = {
    회사: 'cccccccc-cccc-4ccc-8ccc-000000000001',
    본부: 'cccccccc-cccc-4ccc-8ccc-000000000002',
    부서급실: 'cccccccc-cccc-4ccc-8ccc-000000000003',
    팀파트: 'cccccccc-cccc-4ccc-8ccc-000000000004',
} as const;

export const 조직시드직원Id = {
    김플랫폼: 'dddddddd-dddd-4ddd-8ddd-000000000001',
    이백엔드: 'dddddddd-dddd-4ddd-8ddd-000000000002',
    개발본부장: 'dddddddd-dddd-4ddd-8ddd-000000000003',
} as const;

export const 조직시드EdpId = {
    김플랫폼_플랫폼파트: 'eeeeeeee-eeee-4eee-8eee-000000000001',
    이백엔드_백엔드실: 'eeeeeeee-eeee-4eee-8eee-000000000002',
    개발본부장_개발본부: 'eeeeeeee-eeee-4eee-8eee-000000000003',
} as const;
