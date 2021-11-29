/// <reference types="node" />
import * as childProcess from 'child_process';
export interface SpawnResult {
    stdout: string;
    stderr: string;
}
export declare function spawn(command: string, args: string[], options?: childProcess.SpawnOptions): Promise<SpawnResult>;
export declare class SpawnError extends Error {
    readonly code: number;
    readonly stdout: string;
    readonly stderr: string;
    constructor(code: number, stdout: string, stderr: string);
}
