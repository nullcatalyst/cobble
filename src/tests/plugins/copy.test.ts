import * as assert from 'assert';
import * as path from 'path';

import { BuildSettings } from '../../composer/settings';
import { CopyPlugin } from '../../plugins/copy';
import { FakeWatcher } from '../../watcher/fake';
import { ResolvedPath } from '../../util/resolved_path';

describe('copy plugin', () => {
    it('should clean up after itself', async () => {
        const basePath = ResolvedPath.absolute('/fake/path/that/does/not/exist', path.posix);

        const watcher = new FakeWatcher();
        const plugin = new CopyPlugin();
        const settings = new BuildSettings('linux');
        await settings.load(
            {
                'name': 'test',
                'srcs': [`${plugin.name()}:a.txt`, `${plugin.name()}:b.png`, `${plugin.name()}:subdir/c.cpp`],
            },
            basePath.join('build.json'),
        );

        const cleanup = await plugin.process(watcher, settings);
        assert.strictEqual(watcher.callbacks.size, 3);
        cleanup();
        assert.strictEqual(watcher.callbacks.size, 0);
    });
});
