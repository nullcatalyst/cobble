"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolvedPath = void 0;
const path = require("path");
/**
 * An immutable, fully-resolved file path.
 */
class ResolvedPath {
    constructor(filePath, platformPath) {
        this._filePath = filePath;
        this._platformPath = platformPath;
    }
    toString() {
        return this._filePath;
    }
    /**
     * Sometimes backslashes in Windows paths are problematic, this provides a simple way around that common problem.
     * @returns a string respresentation of the path, with the platform-specific path separator replaced by '/'
     */
    toStringWithSlashSep() {
        return this._filePath.replace(this._platformPath.sep, '/');
    }
    /**
     * @returns the name of the file, without the extension or the directory
     */
    get name() {
        return this._platformPath.parse(this._filePath).name;
    }
    /**
     * @returns the extension of the file, without the leading dot
     */
    get ext() {
        return this._platformPath.parse(this._filePath).ext.slice(1);
    }
    static absolute(filePath, platformPath = path) {
        return new ResolvedPath(platformPath.normalize(filePath), platformPath);
    }
    static absoluteForSamePlatform(filePath, other) {
        return new ResolvedPath(other._platformPath.normalize(filePath), other._platformPath);
    }
    dirname() {
        return new ResolvedPath(this._platformPath.dirname(this._filePath), this._platformPath);
    }
    join(to) {
        return new ResolvedPath(this._platformPath.resolve(this._filePath, to), this._platformPath);
    }
    /**
     * Finds the longest common subpath shared between two paths.
     * If the two paths are on different platforms (or different drive letters on Windows), then this will throw an error.
     * @param other the other path to compare with
     * @returns the longest common subpath shared between the two paths
     */
    commonSubPath(other) {
        if (this._platformPath !== other._platformPath) {
            throw new Error('cannot compare paths on different platforms');
        }
        const thisParts = this._filePath.split(this._platformPath.sep);
        const otherParts = other._filePath.split(this._platformPath.sep);
        for (let i = 0; i < Math.min(thisParts.length, otherParts.length); ++i) {
            if (thisParts[i] !== otherParts[i]) {
                if (i === 0) {
                    // This should only happen on Windows, where the drive letter is different
                    // This cannot happen on posix systems, because the first part is the empty string (due to the way that str.split() works)
                    throw new Error('no common file path between different drives');
                }
                if (i === 1) {
                    // Append a trailing slash to the first directory
                    // On Windows, the drive letter should have a tailing slash
                    // On posix systems, this is just the root slash, because the first part will be the empty string (due to the way that str.split() works)
                    return new ResolvedPath(`${thisParts[0]}${this._platformPath.sep}`, this._platformPath);
                }
                return new ResolvedPath(thisParts.slice(0, i).join(this._platformPath.sep), this._platformPath);
            }
        }
        // Paths are identical, so return the shortest path
        return thisParts.length < otherParts.length ? this : other;
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
    relative(other) {
        if (this._platformPath !== other._platformPath) {
            throw new Error('cannot find relative paths on different platforms');
        }
        return this._platformPath.relative(this._filePath.toString(), other._filePath.toString());
    }
}
exports.ResolvedPath = ResolvedPath;
