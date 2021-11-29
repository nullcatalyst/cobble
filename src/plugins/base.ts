import { BuildSettings } from '../composer/settings';
import { ResolvedPath } from '../util/resolved_path';
import { BaseWatcher } from '../watcher/base';

export type ResetPluginWatchedFilesFn = () => void;

export class BasePlugin {
    constructor(opts: { 'tmp': ResolvedPath }) {}

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
