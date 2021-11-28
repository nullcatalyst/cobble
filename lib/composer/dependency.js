"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dependency = void 0;
class Dependency {
    constructor(filePath) {
        this._filePath = filePath;
        this._lastUpdated = new Date();
        this._lastUpdated.setHours(this._lastUpdated.getHours() - 1);
        this._dependencies = new Set();
        this._handlers = new Set();
    }
    get filePath() {
        return this._filePath;
    }
    setDependencies(timestamp, dependencies) {
        if (timestamp < this._lastUpdated) {
            // The timestamp is before the most recent update, so these dependencies are old and out of date -- ignore them
            return;
        }
        this._dependencies = new Set(dependencies.map(dep => dep.toString()));
    }
    checkDependsOn(filePath) {
        return this._dependencies.has(filePath.toString());
    }
}
exports.Dependency = Dependency;
