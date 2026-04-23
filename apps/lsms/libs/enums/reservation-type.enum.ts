export enum ReservationStatus {
    PENDING = 'PENDING', // 예약대기
    CONFIRMED = 'CONFIRMED', // 예약완료
    USING = 'USING', // 예약사용중
    CLOSING = 'CLOSING', // 예약마무리중
    CLOSED = 'CLOSED', // 예약종료
    CANCELLED = 'CANCELLED', // 예약취소
    REJECTED = 'REJECTED', // 예약반려
}

export enum ParticipantsType {
    RESERVER = 'RESERVER', // 예약자
    PARTICIPANT = 'PARTICIPANT', // 참여자
    CC_RECEIPIENT = 'CC_RECEIPIENT', // 수신참조자
    /** 일정: 참석자가 아닌 직원이 내 캘린더에만 추가한 참조 관계 */
    SCHEDULE_REFERENCE = 'SCHEDULE_REFERENCE',
}
