import { BuildSettings } from '../composer/settings';
import { ResolvedPath } from '../util/resolved_path';
import { BaseWatcher } from '../watcher/base';
export declare type ResetPluginWatchedFilesFn = () => void;
export interface PluginOptions {
    'release': boolean;
    'verbose': number;
    'tmp': ResolvedPath;
}
export declare class BasePlugin {
    private readonly _release;
    private readonly _verbose;
    private readonly _tmp;
    constructor(opts: PluginOptions);
    get verbose(): number;
    get release(): boolean;
    get tmp(): ResolvedPath;
    name(): string;
    provideProtocolExtensions(): string[];
    process(watcher: BaseWatcher, settings: BuildSettings): Promise<ResetPluginWatchedFilesFn>;
    cleanup(): void;
}
