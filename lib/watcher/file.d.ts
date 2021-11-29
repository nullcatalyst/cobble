import { ResolvedPath } from '../util/resolved_path';
import { BaseWatcher } from './base';
export declare class FileWatcher extends BaseWatcher {
    private readonly _watchers;
    start(basePath: ResolvedPath): void;
    stop(): void;
}
