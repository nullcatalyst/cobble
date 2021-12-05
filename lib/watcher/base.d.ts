import { ResolvedPath } from '../util/resolved_path';
import { Event } from './event';
export declare type CleanupCallback = () => void;
export declare abstract class BaseWatcher {
    protected readonly _verbose: number;
    protected readonly _callbacks: Map<string, ((event: Event) => void)[]>;
    constructor(verbose: number);
    emit(event: Event): Promise<void>;
    add(filePath: ResolvedPath, callback: (event: Event) => void): CleanupCallback;
    remove(filePath: ResolvedPath, callback: (event: Event) => void): void;
}
