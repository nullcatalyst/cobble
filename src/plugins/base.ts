import { BuildSettings } from '../composer/settings';
import { Target } from '../composer/target';
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
    private readonly _tmpPath: ResolvedPath;

    constructor(opts: PluginOptions) {
        this._release = opts['release'];
        this._verbose = opts['verbose'];
        this._tmpPath = opts['tmp'];
    }

    /**
     * @returns the verbosity level for this plugin
     */
    get verbose(): number {
        return this._verbose;
    }

    /**
     * @returns whether this plugin is being used in a release build
     */
    get release(): boolean {
        return this._release;
    }

    /**
     * @returns a fully resolved path to a temporary directory that can be used for intermediate files
     */
    get tmpPath(): ResolvedPath {
        return this._tmpPath;
    }

    /**
     * @returns the name of this plugin
     */
    name(): string {
        throw new Error('cannot use a plugin without a name');
    }

    /**
     * Provide a set of file extensions that can be built using this plugin
     * @returns the list of file extensions
     */
    provideProtocolExtensions(): string[] {
        return [];
    }

    /**
     * Process the build file, adding event handlers to watch for appropriate file changes
     * @param watcher the watcher to use
     * @param settings the build settings
     * @returns a cleanup function, which will be called whenever the build file changes; this should remove all existing event handlers in case the files are no longer needed
     */
    async process(watcher: BaseWatcher, settings: BuildSettings): Promise<ResetPluginWatchedFilesFn> {
        return () => {};
    }

    /**
     * Clean up any resources used by the plugin, it is not needed anymore and will be disposed
     */
    cleanup(): void {}

    /**
     * Filter the list of sources defined in the build settings to only those that are supported by this plugin
     * @param settings the build settings
     * @returns the filtered list of sources
     */
    filterSrcs(settings: BuildSettings): Target[] {
        return settings.srcs.filter(src => src.protocol === this.name());
    }

    /**
     * Log a message, but only if the verbose level is high enough.
     * @param minimumVerbosityLevel the verbose level to log at
     * @param message the message(s) to log
     */
    log(minimumVerbosityLevel: number, ...message: any[]): void {
        if (this._verbose >= minimumVerbosityLevel) {
            console.log(`[${this.name()}]`, ...message);
        }
    }
}
