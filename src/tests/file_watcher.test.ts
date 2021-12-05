import { expect } from 'chai';
import * as fs from 'fs';
import * as tmp from 'tmp-promise';
import { ResolvedPath } from '../util/resolved_path';
import { EventType } from '../watcher/event';
import { FileWatcher } from '../watcher/file';

describe('file watcher', () => {
    const defer: (() => void)[] = [];
    afterEach(() => {
        defer.forEach(f => f());
        defer.length = 0;
    });

    it('should watch files', async () => {
        const { path: dirPath, cleanup: dirCleanup } = await tmp.dir({ unsafeCleanup: true });
        defer.push(dirCleanup);

        const dir = ResolvedPath.absolute(dirPath);
        const watcher = new FileWatcher(0);
        watcher.start(dir);
        defer.push(() => watcher.stop());

        // Create a new file
        const filePath = dir.join('file.txt');
        await new Promise<void>((resolve, reject) => {
            const cleanup = watcher.add(filePath, event => {
                try {
                    expect(event.type).to.equal(EventType.AddFile);
                    expect(event.filePath.toString()).to.equal(filePath.toString());
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
            defer.push(cleanup);

            fs.writeFileSync(filePath.toString(), 'hello', 'utf8');
        });

        // Change the existing file
        await new Promise<void>((resolve, reject) => {
            const cleanup = watcher.add(filePath, event => {
                try {
                    expect(event.type).to.equal(EventType.ChangeFile);
                    expect(event.filePath.toString()).to.equal(filePath.toString());
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
            defer.push(cleanup);

            fs.writeFileSync(filePath.toString(), 'hello', 'utf8');
        });
    });
});
