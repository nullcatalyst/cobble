import { ResolvedPath } from '../util/resolved_path';

export class Target {
    private readonly _path: ResolvedPath;
    private readonly _protocol: string;

    private constructor(path: ResolvedPath, protocol: string) {
        this._path = path;
        this._protocol = protocol;
    }

    static parse(fileName: string, basePath: ResolvedPath, fileExtProtocols: { [ext: string]: string }): Target {
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

    get path(): ResolvedPath {
        return this._path;
    }

    get protocol(): string {
        return this._protocol;
    }
}
