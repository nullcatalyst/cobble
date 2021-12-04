import { BasePlugin } from '..';
import { ResolvedPath } from '../util/resolved_path';
import { BuildTargetPlatform, RawBuildFile } from './raw';
import { Target } from './target';
export interface Options {
    'release': boolean;
    'target': BuildTargetPlatform;
    'fileExtProtocols': MapLike<string>;
    'replaceVariables': MapLike<(arg?: string) => string>;
    'pluginNames': string[];
}
export declare class BuildSettings {
    private _raw;
    /**
     * The directory that contains this build file.
     * All relative paths in the build file will be relative to this.
     */
    private _basePath;
    /** The name as defined in the build file. This may be used to create the output file name if no other output name is given. */
    private _name;
    private _target;
    private _release;
    private _outDirPath;
    private _srcs;
    private _deps;
    private _pluginSettings;
    private constructor();
    static load(filePath: ResolvedPath, opts?: Partial<Options>): Promise<BuildSettings>;
    static from(raw: RawBuildFile, opts?: Partial<Options & {
        'basePath': ResolvedPath;
    }>): Promise<BuildSettings>;
    get name(): string;
    get basePath(): ResolvedPath;
    get outDir(): ResolvedPath;
    get target(): BuildTargetPlatform;
    get release(): boolean;
    get srcs(): Target[];
    get deps(): ResolvedPath[];
    get raw(): any;
    pluginSettings<T>(plugin: BasePlugin): Partial<T>;
}
interface MapLike<T> {
    [key: string]: T;
}
export {};
