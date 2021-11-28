import * as chokidar from 'chokidar';

import { BaseWatcher } from './base';
import { Event, EventType } from './event';

import { ResolvedPath } from '../util/resolved_path';

export class FileWatcher extends BaseWatcher {
    private readonly _watcher: chokidar.FSWatcher;

    constructor(basePath: ResolvedPath) {
        super();

        const watcher = chokidar
            .watch(basePath.toString())
            .on('add', fileName => {
                console.log(`File ${fileName} has been added`);
                this.emit(new Event(EventType.AddFile, basePath.relative(fileName)));
            })
            .on('change', fileName => {
                console.log(`File ${fileName} has been changed`);
                this.emit(new Event(EventType.ChangeFile, basePath.relative(fileName)));
            })
            .on('unlink', fileName => {
                console.log(`File ${fileName} has been removed`);
                this.emit(new Event(EventType.DeleteFile, basePath.relative(fileName)));
            });

        this._watcher = watcher;
    }

    override stop(): void {
        super.stop();
        this._watcher.close();
    }
}
