"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileWatcher = void 0;
const chokidar = require("chokidar");
const base_1 = require("./base");
const event_1 = require("./event");
class FileWatcher extends base_1.BaseWatcher {
    constructor() {
        super(...arguments);
        this._watchers = [];
    }
    start(basePath) {
        const watcher = chokidar
            .watch(basePath.toString())
            .on('add', fileName => {
            this.emit(new event_1.Event(event_1.EventType.AddFile, basePath.join(fileName)));
        })
            .on('change', fileName => {
            this.emit(new event_1.Event(event_1.EventType.ChangeFile, basePath.join(fileName)));
        })
            .on('unlink', fileName => {
            this.emit(new event_1.Event(event_1.EventType.DeleteFile, basePath.join(fileName)));
        });
        this._watchers.push(watcher);
    }
    stop() {
        for (const watcher of this._watchers) {
            watcher.close();
        }
        this._watchers.length = 0;
    }
}
exports.FileWatcher = FileWatcher;
