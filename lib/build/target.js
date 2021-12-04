"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Target = void 0;
class Target {
    constructor(path, protocol) {
        this._path = path;
        this._protocol = protocol;
    }
    static parse(fileName, basePath, fileExtProtocols) {
        const protocolRegex = /^(?:([a-zA-Z0-9_-]+):)([^/\\].*)/;
        const match = fileName.match(protocolRegex);
        if (match != null) {
            return new Target(basePath.join(match[2]), match[1]);
        }
        const filePath = basePath.join(fileName);
        const ext = filePath.ext;
        if (ext in fileExtProtocols) {
            return new Target(filePath, fileExtProtocols[ext]);
        }
        throw new Error(`no suitable protocol found for ${fileName}`);
    }
    get path() {
        return this._path;
    }
    get protocol() {
        return this._protocol;
    }
}
exports.Target = Target;
