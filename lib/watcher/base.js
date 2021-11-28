"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseWatcher = void 0;
const event_1 = require("./event");
class BaseWatcher {
    constructor() {
        this._callbacks = new Map();
    }
    stop() {
        // Do nothing
    }
    emit(event) {
        console.log(`${event_1.IN_PROGRESS_EVENT_NAMES[event.type]} ${event.filePath}`);
        const callbacks = this._callbacks.get(event.filePath.toString());
        if (callbacks == null) {
            console.log(`No callbacks for ${event.filePath}`);
            return;
        }
        callbacks.forEach(callback => {
            try {
                callback(event);
            }
            catch (err) {
                console.error(err);
            }
        });
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
        }
    }
}
exports.BaseWatcher = BaseWatcher;
