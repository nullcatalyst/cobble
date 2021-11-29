import { BaseWatcher } from '../watcher/base';
import { BuildSettings } from '../composer/settings';
import { ResolvedPath } from '../util/resolved_path';
export declare type ResetPluginWatchedFilesFn = () => void;
export declare class BasePlugin {
    constructor(opts: {
        'tmp': ResolvedPath;
    });
    name(): string;
    provideProtocolExtensions(): string[];
    process(watcher: BaseWatcher, settings: BuildSettings): Promise<ResetPluginWatchedFilesFn>;
    cleanup(): void;
}
