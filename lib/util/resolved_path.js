"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolvedPath = void 0;
const path = require("path");
class ResolvedPath {
    constructor(filePath, platformPath) {
        this._filePath = filePath;
        this._platformPath = platformPath;
    }
    static absolute(filePath, platformPath = path) {
        return new ResolvedPath(platformPath.normalize(filePath), platformPath);
    }
    dirname() {
        return new ResolvedPath(this._platformPath.dirname(this._filePath), this._platformPath);
    }
    relative(to) {
        return new ResolvedPath(this._platformPath.resolve(this._filePath, to), this._platformPath);
    }
    replaceBasePath(base, newBase) {
        return new ResolvedPath(this._platformPath.resolve(newBase._filePath, this._platformPath.relative(base._filePath, this._filePath)), this._platformPath);
    }
    replaceFileName(fileName) {
        return new ResolvedPath(this._platformPath.normalize(this._platformPath.join(this._platformPath.dirname(this._filePath), fileName)), this._platformPath);
    }
    modifyFileName(callback) {
        return new ResolvedPath(this._platformPath.normalize(this._platformPath.join(this._platformPath.dirname(this._filePath), callback(this.name, this.ext))), this._platformPath);
    }
    toString() {
        return this._filePath;
    }
    get name() {
        return this._platformPath.parse(this._filePath).name;
    }
    get ext() {
        return this._platformPath.parse(this._filePath).ext;
    }
}
exports.ResolvedPath = ResolvedPath;
