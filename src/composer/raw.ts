export type BuildType = 'exe' | 'lib' | 'none';
export type BuildStandard = 'c11' | 'c17' | 'c++11' | 'c++14' | 'c++17' | 'c++20';
export type BuildTargetPlatform = 'win32' | 'darwin' | 'linux' | 'wasm';

export interface RawBuildFile extends RawBuildSettings {
    'name'?: string;
    'type'?: BuildType;
    'std'?: BuildStandard;
    'platform'?: RawBuildPlatformSettings;
}

export type RawBuildPlatformSettings =
    | { [platform in BuildTargetPlatform]: RawBuildSettings }
    | { [expr: string]: RawBuildSettings };

export interface RawBuildSettings {
    'srcs'?: string[];
    'defines'?: string[];
    'includes'?: string[];
    'libs'?: string[];
    'flags'?: string[];
    'deps'?: string[];
}
