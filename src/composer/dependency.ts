import { ResolvedPath } from '../util/resolved_path';

export class Dependency {
    private _filePath: ResolvedPath;
    private _lastUpdated: Date;
    private _dependencies: Set<string>;
    private _handlers: Set<() => void>;

    constructor(filePath: ResolvedPath) {
        this._filePath = filePath;
        this._lastUpdated = new Date();
        this._lastUpdated.setHours(this._lastUpdated.getHours() - 1);
        this._dependencies = new Set();
        this._handlers = new Set();
    }

    get filePath(): ResolvedPath {
        return this._filePath;
    }

    setDependencies(timestamp: Date, dependencies: ResolvedPath[]) {
        if (timestamp < this._lastUpdated) {
            // The timestamp is before the most recent update, so these dependencies are old and out of date -- ignore them
            return;
        }

        this._dependencies = new Set(dependencies.map(dep => dep.toString()));
    }

    checkDependsOn(filePath: ResolvedPath): boolean {
        return this._dependencies.has(filePath.toString());
    }
}
