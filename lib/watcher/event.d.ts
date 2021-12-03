import { ResolvedPath } from '../util/resolved_path';
export declare enum EventType {
    AddFile = 0,
    ChangeFile = 1,
    DeleteFile = 2,
    BuildFile = 3
}
export declare const EVENT_NAMES: string[];
export declare class Event {
    private readonly _type;
    private readonly _filePath;
    private readonly _timestamp;
    constructor(type: EventType, filePath: ResolvedPath, timestamp?: Date);
    get type(): EventType;
    get filePath(): ResolvedPath;
    get timestamp(): Date;
}
