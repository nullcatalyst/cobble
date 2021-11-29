import * as fs from 'fs';

import { BasePlugin, ResetPluginWatchedFilesFn } from './base';
import { BaseWatcher } from '../watcher/base';
import { BuildSettings } from '../composer/settings';
import { mkdir } from '../util/mkdir';

export class CopyPlugin extends BasePlugin {
    override name(): string {
        return 'copy';
    }

    async process(watcher: BaseWatcher, settings: BuildSettings): Promise<ResetPluginWatchedFilesFn> {
        const srcs = settings.srcs.filter(src => src.protocol == this.name());
        const outputDir = settings.outputPath.dirname();

        const cleanupFns = srcs.map(src => {
            const rel = settings.basePath.relative(src.path);
            const dst = outputDir.join(rel);

            return watcher.add(src.path, async event => {
                await mkdir(dst.dirname());
                await fs.promises.copyFile(src.path.toString(), dst.toString());
            });
        });

        return () => {
            for (const cleanupFn of cleanupFns) {
                cleanupFn();
            }
        };
    }
}
