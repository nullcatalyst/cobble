export type BuildType = 'exe' | 'lib' | 'none';
export type BuildStandard = 'c11' | 'c17' | 'c++11' | 'c++14' | 'c++17' | 'c++20';
export type BuildTargetPlatform = 'win32' | 'darwin' | 'linux' | 'wasm';

export interface RawBuildFile extends RawBuildSettings {
    'name'?: string;
    'type'?: BuildType;
    'std'?: BuildStandard;
    'platform'?: RawBuildPlatformSettings;
}

/**
 * Platform-specific build settings.
 * This property names can be any build platform, eg: `win32`, `darwin`, `linux`, or `wasm`,
 * or an expression that evaluates to `true` or `false` based on these, eg: `!win32`, `darwin && !wasm`, etc.
 * The special variable `release` can also be used to determine whether the build is in release mode.
 */
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
