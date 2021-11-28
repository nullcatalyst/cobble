import { ResolvedPath } from '../util/resolved_path';

export const enum EventType {
    AddFile,
    ChangeFile,
    DeleteFile,
    BuildFile,
}

export const IN_PROGRESS_EVENT_NAMES = ['adding', 'changing', 'deleting', 'building'];

export class Event {
    private readonly _type: EventType;
    private readonly _filePath: ResolvedPath;
    private readonly _timestamp: Date;

    constructor(type: EventType, filePath: ResolvedPath, timestamp = new Date()) {
        this._type = type;
        this._filePath = filePath;
        this._timestamp = timestamp;
    }

    get type(): EventType {
        return this._type;
    }

    get filePath(): ResolvedPath {
        return this._filePath;
    }

    get timestamp(): Date {
        return this._timestamp;
    }
}
