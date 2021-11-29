"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseWatcher = void 0;
const event_1 = require("./event");
class BaseWatcher {
    constructor(verbosity = 0) {
        this._callbacks = new Map();
        this._verbosity = verbosity;
    }
    stop() {
        // Do nothing
    }
    emit(event) {
        if (this._verbosity > 1) {
            console.log(`${event_1.IN_PROGRESS_EVENT_NAMES[event.type]} ${event.filePath}`);
        }
        const callbacks = this._callbacks.get(event.filePath.toString());
        if (callbacks == null) {
            if (this._verbosity > 0) {
                console.log(`[WARN] no callbacks for ${event.filePath}`);
            }
            return;
        }
        return Promise.all(callbacks.map(callback => {
            try {
                callback(event);
            }
            catch (err) {
                console.error(err);
            }
        })).then(() => { });
    }
    add(filePath, callback) {
        const callbacks = this._callbacks.get(filePath.toString());
        if (callbacks == null) {
            this._callbacks.set(filePath.toString(), [callback]);
        }
        else {
            callbacks.push(callback);
        }
        return () => {
            this.remove(filePath, callback);
        };
    }
    remove(filePath, callback) {
        const callbacks = this._callbacks.get(filePath.toString());
        if (callbacks == null) {
            return;
        }
        const index = callbacks.indexOf(callback);
        if (index >= 0) {
            callbacks.splice(index, 1);
            if (callbacks.length === 0) {
                this._callbacks.delete(filePath.toString());
            }
        }
    }
}
exports.BaseWatcher = BaseWatcher;
