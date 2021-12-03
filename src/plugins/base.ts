import { BuildSettings } from '../composer/settings';
import { ResolvedPath } from '../util/resolved_path';
import { BaseWatcher } from '../watcher/base';

export type ResetPluginWatchedFilesFn = () => void;

export interface PluginOptions {
    'release': boolean;
    'verbose': number;
    'tmp': ResolvedPath;
}

export class BasePlugin {
    private readonly _release: boolean;
    private readonly _verbose: number;
    private readonly _tmp: ResolvedPath;

    constructor(opts: PluginOptions) {
        this._release = opts['release'];
        this._verbose = opts['verbose'];
        this._tmp = opts['tmp'];
    }

    get verbose(): number {
        return this._verbose;
    }

    get release(): boolean {
        return this._release;
    }

    get tmp(): ResolvedPath {
        return this._tmp;
    }

    name(): string {
        throw new Error('cannot use a plugin without a name');
    }

    // Provide a set of file extensions that can be built using this plugin
    provideProtocolExtensions(): string[] {
        return [];
    }

    // Process the build file, adding event handlers to watch for appropriate file changes
    async process(watcher: BaseWatcher, settings: BuildSettings): Promise<ResetPluginWatchedFilesFn> {
        return () => {};
    }

    // Clean up any resources used by the plugin, it is not needed anymore and will be disposed
    cleanup(): void {}
}
