import { ResolvedPath } from '../util/resolved_path';
export declare class Target {
    private readonly _path;
    private readonly _protocol;
    private constructor();
    static parse(fileName: string, basePath: ResolvedPath, fileExtProtocols: {
        [ext: string]: string;
    }): Target;
    get path(): ResolvedPath;
    get protocol(): string;
}
