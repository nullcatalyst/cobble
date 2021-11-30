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

    static absoluteForSamePlatform(filePath: string, other: ResolvedPath): ResolvedPath {
        return new ResolvedPath(other._platformPath.normalize(filePath), other._platformPath);
    }

    dirname(): ResolvedPath {
        return new ResolvedPath(this._platformPath.dirname(this._filePath), this._platformPath);
    }

    join(to: string): ResolvedPath {
        return new ResolvedPath(this._platformPath.resolve(this._filePath, to), this._platformPath);
    }

    commonSubPath(other: ResolvedPath): ResolvedPath {
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

    relative(other: ResolvedPath): string {
        if (this._platformPath !== other._platformPath) {
            throw new Error('cannot find relative paths on different platforms');
        }

        return this._platformPath.relative(this._filePath.toString(), other._filePath.toString());
    }

    toString(): string {
        return this._filePath;
    }

    get name(): string {
        return this._platformPath.parse(this._filePath).name;
    }

    // Returns the extension of the file, without the leading dot
    get ext(): string {
        return this._platformPath.parse(this._filePath).ext.slice(1);
    }
}
