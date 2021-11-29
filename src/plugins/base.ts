import { BaseWatcher } from '../watcher/base';
import { BuildSettings } from '../composer/settings';

export type ResetPluginWatchedFilesFn = () => void;

export abstract class BasePlugin {
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
