"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = exports.IN_PROGRESS_EVENT_NAMES = void 0;
exports.IN_PROGRESS_EVENT_NAMES = ['adding', 'changing', 'deleting', 'building'];
class Event {
    constructor(type, filePath, timestamp = new Date()) {
        this._type = type;
        this._filePath = filePath;
        this._timestamp = timestamp;
    }
    get type() {
        return this._type;
    }
    get filePath() {
        return this._filePath;
    }
    get timestamp() {
        return this._timestamp;
    }
}
exports.Event = Event;
