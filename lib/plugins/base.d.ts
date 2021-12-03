import { BuildSettings } from '../composer/settings';
import { Target } from '../composer/target';
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
    private readonly _tmpPath;
    constructor(opts: PluginOptions);
    /**
     * @returns the verbosity level for this plugin
     */
    get verbose(): number;
    /**
     * @returns whether this plugin is being used in a release build
     */
    get release(): boolean;
    /**
     * @returns a fully resolved path to a temporary directory that can be used for intermediate files
     */
    get tmpPath(): ResolvedPath;
    /**
     * @returns the name of this plugin
     */
    name(): string;
    /**
     * Provide a set of file extensions that can be built using this plugin
     * @returns the list of file extensions
     */
    provideProtocolExtensions(): string[];
    /**
     * Process the build file, adding event handlers to watch for appropriate file changes
     * @param watcher the watcher to use
     * @param settings the build settings
     * @returns a cleanup function, which will be called whenever the build file changes; this should remove all existing event handlers in case the files are no longer needed
     */
    process(watcher: BaseWatcher, settings: BuildSettings): Promise<ResetPluginWatchedFilesFn>;
    /**
     * Clean up any resources used by the plugin, it is not needed anymore and will be disposed
     */
    cleanup(): void;
    /**
     * Filter the list of sources defined in the build settings to only those that are supported by this plugin
     * @param settings the build settings
     * @returns the filtered list of sources
     */
    filterSrcs(settings: BuildSettings): Target[];
    /**
     * Log a message, but only if the verbose level is high enough.
     * @param minimumVerbosityLevel the verbose level to log at
     * @param message the message(s) to log
     */
    log(minimumVerbosityLevel: number, ...message: any[]): void;
}
