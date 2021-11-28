"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileWatcher = void 0;
const chokidar = require("chokidar");
const base_1 = require("./base");
const event_1 = require("./event");
class FileWatcher extends base_1.BaseWatcher {
    constructor(basePath) {
        super();
        const watcher = chokidar
            .watch(basePath.toString())
            .on('add', fileName => {
            console.log(`File ${fileName} has been added`);
            this.emit(new event_1.Event(0 /* AddFile */, basePath.relative(fileName)));
        })
            .on('change', fileName => {
            console.log(`File ${fileName} has been changed`);
            this.emit(new event_1.Event(1 /* ChangeFile */, basePath.relative(fileName)));
        })
            .on('unlink', fileName => {
            console.log(`File ${fileName} has been removed`);
            this.emit(new event_1.Event(2 /* DeleteFile */, basePath.relative(fileName)));
        });
        this._watcher = watcher;
    }
    stop() {
        super.stop();
        this._watcher.close();
    }
}
exports.FileWatcher = FileWatcher;
