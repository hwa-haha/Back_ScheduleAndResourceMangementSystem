export type DailySummarySnapshot = {
    id: string;
    monthlySummaryId: string;
    date: string | null;
    enter: string | null;
    leave: string | null;
    usedAttendancesCount: number;
    isLate?: boolean | null;
    isEarlyLeave?: boolean | null;
    isAbsent?: boolean | null;
};

export type AttendanceDetailSnapshot = {
    dailyEventSummaryId?: string;
    date?: string | null;
    enter?: string | null;
    leave?: string | null;
    isLate?: boolean | null;
    isEarlyLeave?: boolean | null;
    isAbsent?: boolean | null;
};

export type MonthlySummarySnapshotSource = {
    id: string;
    employeeNumber?: string;
    employeeName?: string;
    lateDetails?: AttendanceDetailSnapshot[];
    absenceDetails?: AttendanceDetailSnapshot[];
    earlyLeaveDetails?: AttendanceDetailSnapshot[];
    dailySummaries?: Array<{
        id: string;
        date: string | null;
        enter?: string | null;
        leave?: string | null;
        usedAttendances?: unknown[];
        isLate?: boolean | null;
        isEarlyLeave?: boolean | null;
        isAbsent?: boolean | null;
    }>;
};

export type DailySummaryChange = {
    key: string;
    before: DailySummarySnapshot | null;
    after: DailySummarySnapshot | null;
    timeChanged: boolean;
    attendanceChanged: boolean;
};

export type DetailChange = {
    monthlySummaryId: string;
    employeeNumber?: string;
    employeeName?: string;
    type: 'late' | 'earlyLeave' | 'absence';
    key: string;
    before: AttendanceDetailSnapshot | null;
    after: AttendanceDetailSnapshot | null;
};

export const buildDailySummarySnapshotMap = (monthlySummaries: MonthlySummarySnapshotSource[]) => {
    const dailySummaries: DailySummarySnapshot[] = [];
    const map = new Map<string, DailySummarySnapshot>();

    monthlySummaries.forEach((monthly) => {
        (monthly.dailySummaries ?? []).forEach((daily) => {
            const snapshot: DailySummarySnapshot = {
                id: daily.id,
                monthlySummaryId: monthly.id,
                date: daily.date ?? null,
                enter: daily.enter ?? null,
                leave: daily.leave ?? null,
                usedAttendancesCount: daily.usedAttendances?.length ?? 0,
                isLate: daily.isLate ?? null,
                isEarlyLeave: daily.isEarlyLeave ?? null,
                isAbsent: daily.isAbsent ?? null,
            };
            dailySummaries.push(snapshot);

            const key = `${monthly.id}|${snapshot.date ?? ''}`;
            map.set(key, snapshot);
        });
    });

    return { dailySummaries, map };
};

export const collectDailySummaryChanges = (
    beforeMap: Map<string, DailySummarySnapshot>,
    afterMap: Map<string, DailySummarySnapshot>,
) => {
    const keys = new Set<string>([...beforeMap.keys(), ...afterMap.keys()]);
    return Array.from(keys)
        .map((key) => {
            const before = beforeMap.get(key) ?? null;
            const after = afterMap.get(key) ?? null;
            if (!before && !after) {
                return null;
            }
            const enterChanged = (before?.enter ?? null) !== (after?.enter ?? null);
            const leaveChanged = (before?.leave ?? null) !== (after?.leave ?? null);
            const usedChanged =
                (before?.usedAttendancesCount ?? 0) !== (after?.usedAttendancesCount ?? 0);
            const isLateChanged = (before?.isLate ?? null) !== (after?.isLate ?? null);
            const isEarlyLeaveChanged =
                (before?.isEarlyLeave ?? null) !== (after?.isEarlyLeave ?? null);
            const isAbsentChanged = (before?.isAbsent ?? null) !== (after?.isAbsent ?? null);
            const timeChanged = enterChanged || leaveChanged;
            const attendanceChanged = usedChanged || isLateChanged || isEarlyLeaveChanged || isAbsentChanged;
            if (!timeChanged && !attendanceChanged) {
                return null;
            }
            return {
                key,
                before,
                after,
                timeChanged,
                attendanceChanged,
            } satisfies DailySummaryChange;
        })
        .filter(Boolean) as DailySummaryChange[];
};

const buildDetailMap = (details?: AttendanceDetailSnapshot[]) => {
    const map = new Map<string, AttendanceDetailSnapshot>();
    (details ?? []).forEach((detail) => {
        const key =
            detail.dailyEventSummaryId ??
            `${detail.date ?? ''}|${detail.enter ?? ''}|${detail.leave ?? ''}`;
        map.set(key, {
            dailyEventSummaryId: detail.dailyEventSummaryId,
            date: detail.date ?? null,
            enter: detail.enter ?? null,
            leave: detail.leave ?? null,
            isLate: detail.isLate ?? null,
            isEarlyLeave: detail.isEarlyLeave ?? null,
            isAbsent: detail.isAbsent ?? null,
        });
    });
    return map;
};

export const collectDetailChanges = (before: MonthlySummarySnapshotSource[], after: MonthlySummarySnapshotSource[]) => {
    const beforeMap = new Map(before.map((summary) => [summary.id, summary]));
    const afterMap = new Map(after.map((summary) => [summary.id, summary]));
    const summaryIds = new Set([...beforeMap.keys(), ...afterMap.keys()]);
    const changes: DetailChange[] = [];

    summaryIds.forEach((summaryId) => {
        const beforeSummary = beforeMap.get(summaryId);
        const afterSummary = afterMap.get(summaryId);
        const employeeNumber = afterSummary?.employeeNumber ?? beforeSummary?.employeeNumber;
        const employeeName = afterSummary?.employeeName ?? beforeSummary?.employeeName;
        const detailGroups = [
            { type: 'late' as const, before: beforeSummary?.lateDetails, after: afterSummary?.lateDetails },
            {
                type: 'earlyLeave' as const,
                before: beforeSummary?.earlyLeaveDetails,
                after: afterSummary?.earlyLeaveDetails,
            },
            { type: 'absence' as const, before: beforeSummary?.absenceDetails, after: afterSummary?.absenceDetails },
        ];

        detailGroups.forEach((group) => {
            const beforeDetails = buildDetailMap(group.before);
            const afterDetails = buildDetailMap(group.after);
            const keys = new Set([...beforeDetails.keys(), ...afterDetails.keys()]);
            keys.forEach((key) => {
                const beforeDetail = beforeDetails.get(key) ?? null;
                const afterDetail = afterDetails.get(key) ?? null;
                if (JSON.stringify(beforeDetail) === JSON.stringify(afterDetail)) {
                    return;
                }
                changes.push({
                    monthlySummaryId: summaryId,
                    employeeNumber,
                    employeeName,
                    type: group.type,
                    key,
                    before: beforeDetail,
                    after: afterDetail,
                });
            });
        });
    });

    return changes;
};

const formatDiff = (label: string, before: unknown, after: unknown) => {
    if (before === after) {
        return null;
    }
    const beforeText = before ?? 'null';
    const afterText = after ?? 'null';
    return `${label} ${beforeText}->${afterText}`;
};

export const formatDailySummaryChange = (change: DailySummaryChange) => {
    const date = change.after?.date ?? change.before?.date ?? '';
    const label = `일일 ${date || change.key}`;
    const parts = [
        formatDiff('enter', change.before?.enter ?? null, change.after?.enter ?? null),
        formatDiff('leave', change.before?.leave ?? null, change.after?.leave ?? null),
        formatDiff(
            'used',
            change.before?.usedAttendancesCount ?? 0,
            change.after?.usedAttendancesCount ?? 0,
        ),
        formatDiff('late', change.before?.isLate ?? null, change.after?.isLate ?? null),
        formatDiff('early', change.before?.isEarlyLeave ?? null, change.after?.isEarlyLeave ?? null),
        formatDiff('absent', change.before?.isAbsent ?? null, change.after?.isAbsent ?? null),
    ].filter(Boolean);

    return `${label}: ${parts.length > 0 ? parts.join(', ') : '변경 없음'}`;
};

export const formatDetailChange = (change: DetailChange) => {
    const label = `${change.employeeNumber ?? ''}${change.employeeName ? ` ${change.employeeName}` : ''}`.trim();
    const date = change.after?.date ?? change.before?.date ?? '';
    const title = `상세 ${change.type} ${label || change.monthlySummaryId} ${date}`.trim();
    const parts = [
        formatDiff('enter', change.before?.enter ?? null, change.after?.enter ?? null),
        formatDiff('leave', change.before?.leave ?? null, change.after?.leave ?? null),
        formatDiff('late', change.before?.isLate ?? null, change.after?.isLate ?? null),
        formatDiff('early', change.before?.isEarlyLeave ?? null, change.after?.isEarlyLeave ?? null),
        formatDiff('absent', change.before?.isAbsent ?? null, change.after?.isAbsent ?? null),
    ].filter(Boolean);

    return `${title}: ${parts.length > 0 ? parts.join(', ') : '변경 없음'}`;
};

export const formatFieldChange = (label: string, before: unknown, after: unknown) =>
    `${label}: ${before ?? 'null'} -> ${after ?? 'null'}`;
