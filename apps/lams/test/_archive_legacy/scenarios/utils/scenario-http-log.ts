import { mkdirSync, writeFileSync } from 'fs';
import * as path from 'path';

type HttpLogEntry = {
    label: string;
    request: Record<string, unknown>;
    response: { status: number; body: unknown };
};

export const createScenarioHttpLogger = (logFileName: string) => {
    const requestLogs: HttpLogEntry[] = [];

    const 기록한다 = (
        label: string,
        requestInfo: Record<string, unknown>,
        response: { status: number; body: unknown },
    ) => {
        requestLogs.push({ label, request: requestInfo, response });
    };

    const 저장한다 = () => {
        if (requestLogs.length === 0) {
            return;
        }
        const logDir = path.resolve(__dirname, '..', 'logs');
        mkdirSync(logDir, { recursive: true });
        const logPath = path.resolve(logDir, logFileName);
        writeFileSync(logPath, JSON.stringify(requestLogs, null, 2), 'utf8');
    };

    return {
        기록한다,
        저장한다,
        requestLogs,
    };
};
