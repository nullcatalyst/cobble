export type BuildType = 'exe' | 'lib' | 'none';
export type BuildStandard = 'c11' | 'c17' | 'c++11' | 'c++14' | 'c++17' | 'c++20';
export type BuildTargetPlatform = 'win32' | 'darwin' | 'linux' | 'wasm';

/**
 * The build file, in json format.
 */
export interface RawBuildFile {
    'name': string;
    'outDir'?: string;

    'srcs'?: string[];
    'deps'?: string[];

    'platform'?: RawBuildPlatformSettings;
}

/**
 * Platform-specific build settings.
 *
 * This property names can be any build platform, eg: `win32`, `darwin`, `linux`, or `wasm`,
 * or an expression that evaluates to `true` or `false` based on these, eg: `!win32`, `darwin && !wasm`, etc.
 * The special variable `release` can also be used to determine whether the build is in release mode.
 */
type RawBuildPlatformSettings =
    | { [platform in BuildTargetPlatform]: RawBuildSettings }
    | { [expr: string]: RawBuildSettings };

interface RawBuildSettings {
    'srcs'?: string[];
    'deps'?: string[];

    [pluginName: string]: {
        [settingName: string]: any;
    };
}
