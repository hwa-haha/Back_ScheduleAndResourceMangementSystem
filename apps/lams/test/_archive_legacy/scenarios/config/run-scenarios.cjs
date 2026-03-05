const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..', 'specs', 'scenarios2');
const jestBin = path.resolve(__dirname, '../../../../..', 'node_modules', 'jest', 'bin', 'jest.js');
const jestConfig = path.resolve(__dirname, '../../jest-e2e.json');

const isScenarioSpec = (fileName) => fileName.endsWith('.e2e-spec.ts');

const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walk(fullPath));
        } else if (entry.isFile() && isScenarioSpec(entry.name)) {
            files.push(fullPath);
        }
    }
    return files;
};

const parseScenarioKey = (filePath) => {
    const base = path.basename(filePath);
    const match = base.match(/^scenario-(.+)\.e2e-spec\.ts$/);
    if (!match) {
        return { type: 'other', key: [] };
    }
    const raw = match[1];
    if (/^\d/.test(raw)) {
        const parts = raw.split('-').map((value) => Number.parseInt(value, 10));
        return { type: 'number', key: parts };
    }
    return { type: 'alpha', key: [raw.toLowerCase().charCodeAt(0)] };
};

const compareKeys = (a, b) => {
    if (a.type !== b.type) {
        return a.type === 'number' ? -1 : 1;
    }
    const len = Math.max(a.key.length, b.key.length);
    for (let i = 0; i < len; i += 1) {
        const left = a.key[i] ?? -1;
        const right = b.key[i] ?? -1;
        if (left !== right) {
            return left - right;
        }
    }
    return 0;
};

const scenarioFiles = walk(rootDir).sort((a, b) => {
    const keyA = parseScenarioKey(a);
    const keyB = parseScenarioKey(b);
    return compareKeys(keyA, keyB);
});

if (scenarioFiles.length === 0) {
    console.error('시나리오 테스트 파일을 찾지 못했습니다.');
    process.exit(1);
}

let exitCode = 0;

for (const scenarioFile of scenarioFiles) {
    const jestArgs = ['--runInBand', '--config', jestConfig, '--runTestsByPath', scenarioFile];
    const result = spawnSync(process.execPath, [jestBin, ...jestArgs], { stdio: 'inherit' });
    if ((result.status ?? 1) !== 0) {
        exitCode = result.status ?? 1;
        break;
    }
}

process.exit(exitCode);
