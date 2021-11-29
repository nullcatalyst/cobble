import { ResolvedPath } from '../util/resolved_path';
import { Event } from './event';
export declare type CleanupCallback = () => void;
export declare abstract class BaseWatcher {
    protected _verbosity: number;
    protected readonly _callbacks: Map<string, ((event: Event) => void)[]>;
    constructor(verbosity?: number);
    stop(): void;
    emit(event: Event): Promise<void>;
    add(filePath: ResolvedPath, callback: (event: Event) => void): CleanupCallback;
    remove(filePath: ResolvedPath, callback: (event: Event) => void): void;
}
