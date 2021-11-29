import { ResolvedPath } from '../util/resolved_path';
export declare class Dependency {
    private _filePath;
    private _lastUpdated;
    private _dependencies;
    private _handlers;
    constructor(filePath: ResolvedPath);
    get filePath(): ResolvedPath;
    setDependencies(timestamp: Date, dependencies: ResolvedPath[]): void;
    checkDependsOn(filePath: ResolvedPath): boolean;
}
