import { BaseWatcher } from './base';
import { ResolvedPath } from '../util/resolved_path';
export declare class FileWatcher extends BaseWatcher {
    private readonly _watchers;
    start(basePath: ResolvedPath): void;
    stop(): void;
}
