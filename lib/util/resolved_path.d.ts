/// <reference types="node" />
import * as path from 'path';
/**
 * An immutable, fully-resolved file path.
 */
export declare class ResolvedPath {
    private readonly _filePath;
    private readonly _platformPath;
    private constructor();
    toString(): string;
    /**
     * Sometimes backslashes in Windows paths are problematic, this provides a simple way around that common problem.
     * @returns a string respresentation of the path, with the platform-specific path separator replaced by '/'
     */
    toStringWithSlashSep(): string;
    /**
     * @returns the name of the file, without the extension or the directory
     */
    get name(): string;
    /**
     * @returns the extension of the file, without the leading dot
     */
    get ext(): string;
    static absolute(filePath: string, platformPath?: path.PlatformPath): ResolvedPath;
    static absoluteForSamePlatform(filePath: string, other: ResolvedPath): ResolvedPath;
    dirname(): ResolvedPath;
    join(to: string): ResolvedPath;
    /**
     * Finds the longest common subpath shared between two paths.
     * If the two paths are on different platforms (or different drive letters on Windows), then this will throw an error.
     * @param other the other path to compare with
     * @returns the longest common subpath shared between the two paths
     */
    commonSubPath(other: ResolvedPath): ResolvedPath;
    replaceBasePath(base: ResolvedPath, newBase: ResolvedPath): ResolvedPath;
    replaceFileName(fileName: string): ResolvedPath;
    modifyFileName(callback: (name: string, ext: string) => string): ResolvedPath;
    relative(other: ResolvedPath): string;
}
