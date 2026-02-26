import { IQuery } from '@nestjs/cqrs';
import { IGetAttendanceIssuesToReviewQuery } from '../../../interfaces';

/**
 * 확인할 근태 이슈 목록 조회 Query
 */
export class GetAttendanceIssuesToReviewQuery implements IQuery {
    constructor(public readonly query: IGetAttendanceIssuesToReviewQuery) {}
}
