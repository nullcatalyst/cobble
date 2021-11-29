/// <reference types="node" />
import * as path from 'path';
export declare class ResolvedPath {
    private readonly _filePath;
    private readonly _platformPath;
    private constructor();
    static absolute(filePath: string, platformPath?: path.PlatformPath): ResolvedPath;
    dirname(): ResolvedPath;
    join(to: string): ResolvedPath;
    commonSubPath(other: ResolvedPath): ResolvedPath;
    replaceBasePath(base: ResolvedPath, newBase: ResolvedPath): ResolvedPath;
    replaceFileName(fileName: string): ResolvedPath;
    modifyFileName(callback: (name: string, ext: string) => string): ResolvedPath;
    relative(other: ResolvedPath): string;
    toString(): string;
    get name(): string;
    get ext(): string;
}
