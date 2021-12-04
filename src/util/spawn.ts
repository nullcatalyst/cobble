import * as childProcess from 'child_process';

export interface SpawnResult {
    stdout: string;
    stderr: string;
}

export function spawn(command: string, args: string[], options?: childProcess.SpawnOptions): Promise<SpawnResult> {
    return new Promise<SpawnResult>((resolve, reject) => {
        const stdout: string[] = [];
        const stderr: string[] = [];

        const process = childProcess.spawn(command, args, options);
        process.on('error', err => {
            reject(err);
        });
        process.on('exit', code => {
            if (code === 0) {
                resolve({
                    stdout: stdout.join(''),
                    stderr: stderr.join(''),
                });
            } else {
                reject(new SpawnError(code, stdout.join(''), stderr.join('')));
            }
        });
        process.stdout?.on('data', (data: Buffer | string) => {
            stdout.push(data.toString('utf8'));
        });
        process.stderr?.on('data', (data: Buffer | string) => {
            stderr.push(data.toString('utf8'));
        });
    });
}

export class SpawnError extends Error {
    constructor(public readonly code: number, public readonly stdout: string, public readonly stderr: string) {
        super(`process exited with code ${code}`);
    }
}
