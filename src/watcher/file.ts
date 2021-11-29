import * as chokidar from 'chokidar';

import { BaseWatcher } from './base';
import { Event, EventType } from './event';

import { ResolvedPath } from '../util/resolved_path';

export class FileWatcher extends BaseWatcher {
    private readonly _watchers: chokidar.FSWatcher[] = [];

    start(basePath: ResolvedPath): void {
        const watcher = chokidar
            .watch(basePath.toString())
            .on('add', fileName => {
                this.emit(new Event(EventType.AddFile, basePath.join(fileName)));
            })
            .on('change', fileName => {
                this.emit(new Event(EventType.ChangeFile, basePath.join(fileName)));
            })
            .on('unlink', fileName => {
                this.emit(new Event(EventType.DeleteFile, basePath.join(fileName)));
            });

        this._watchers.push(watcher);
    }

    override stop(): void {
        for (const watcher of this._watchers) {
            watcher.close();
        }
        this._watchers.length = 0;
    }
}
