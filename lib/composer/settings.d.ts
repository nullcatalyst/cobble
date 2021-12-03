import { ResolvedPath } from '../util/resolved_path';
import { BuildTargetPlatform, BuildType, RawBuildFile } from './raw';
import { Target } from './target';
export declare class BuildSettings {
    private _raw;
    private _basePath;
    private _outputPath;
    private _name;
    private _target;
    private _type;
    private _release;
    private _srcs;
    private _includes;
    private _defines;
    private _flags;
    constructor(target: BuildTargetPlatform);
    load(raw: RawBuildFile, filePath: ResolvedPath, fileExtProtocols?: {
        [ext: string]: string;
    }, release?: boolean): Promise<void>;
    get name(): string;
    get basePath(): ResolvedPath;
    get outputPath(): ResolvedPath;
    get target(): BuildTargetPlatform;
    get type(): BuildType;
    get release(): boolean;
    get debug(): boolean;
    get srcs(): Target[];
    get includes(): ResolvedPath[];
    get defines(): string[];
    get flags(): string[];
    raw<T>(property: string): T | undefined;
    merge(other: BuildSettings): this;
    mergeDependency(otherName: string, other: BuildSettings): this;
    private _replaceVariables;
}
