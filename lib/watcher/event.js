"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = exports.IN_PROGRESS_EVENT_NAMES = exports.EventType = void 0;
var EventType;
(function (EventType) {
    EventType[EventType["AddFile"] = 0] = "AddFile";
    EventType[EventType["ChangeFile"] = 1] = "ChangeFile";
    EventType[EventType["DeleteFile"] = 2] = "DeleteFile";
    EventType[EventType["BuildFile"] = 3] = "BuildFile";
})(EventType = exports.EventType || (exports.EventType = {}));
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
