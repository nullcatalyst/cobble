import * as path from 'path';

export class ResolvedPath {
    private readonly _filePath: string;
    private readonly _platformPath: path.PlatformPath;

    private constructor(filePath: string, platformPath: path.PlatformPath) {
        this._filePath = filePath;
        this._platformPath = platformPath;
    }

    static absolute(filePath: string, platformPath: path.PlatformPath = path): ResolvedPath {
        return new ResolvedPath(platformPath.normalize(filePath), platformPath);
    }

    dirname(): ResolvedPath {
        return new ResolvedPath(this._platformPath.dirname(this._filePath), this._platformPath);
    }

    relative(to: string): ResolvedPath {
        return new ResolvedPath(this._platformPath.resolve(this._filePath, to), this._platformPath);
    }

    replaceBasePath(base: ResolvedPath, newBase: ResolvedPath): ResolvedPath {
        return new ResolvedPath(
            this._platformPath.resolve(newBase._filePath, this._platformPath.relative(base._filePath, this._filePath)),
            this._platformPath,
        );
    }

    replaceFileName(fileName: string): ResolvedPath {
        return new ResolvedPath(
            this._platformPath.normalize(this._platformPath.join(this._platformPath.dirname(this._filePath), fileName)),
            this._platformPath,
        );
    }

    modifyFileName(callback: (name: string, ext: string) => string): ResolvedPath {
        return new ResolvedPath(
            this._platformPath.normalize(
                this._platformPath.join(this._platformPath.dirname(this._filePath), callback(this.name, this.ext)),
            ),
            this._platformPath,
        );
    }

    toString(): string {
        return this._filePath;
    }

    get name(): string {
        return this._platformPath.parse(this._filePath).name;
    }

    get ext(): string {
        return this._platformPath.parse(this._filePath).ext;
    }
}
