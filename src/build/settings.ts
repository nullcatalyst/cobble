import * as fs from 'fs';
import * as json5 from 'json5';
import * as os from 'os';
import { BasePlugin } from '..';
import { ResolvedPath } from '../util/resolved_path';
import { BuildTargetPlatform, RawBuildFile } from './raw';
import { Target } from './target';

const KNOWN_TARGETS = ['win32', 'darwin', 'linux', 'wasm'];

export interface Options {
    'release': boolean;
    'target': BuildTargetPlatform;
    'fileExtProtocols': MapLike<string>;
    'replaceVariables': MapLike<(arg?: string) => string>;
    'pluginNames': string[];
}

export class BuildSettings {
    private _raw: RawBuildFile;

    /**
     * The directory that contains this build file.
     * All relative paths in the build file will be relative to this.
     */
    private _configPath: ResolvedPath;

    /**
     * The deepest directory that contains all source files.
     */
    private _basePath: ResolvedPath;

    /** The name as defined in the build file. This may be used to create the output file name if no other output name is given. */
    private _name: string;
    private _target: BuildTargetPlatform;
    private _release: boolean;
    private _outDirPath: ResolvedPath;

    private _ignores: ResolvedPath[];
    private _srcs: Target[];
    private _deps: ResolvedPath[];
    private _pluginSettings: MapLike<MapLike<any>> = {};

    private constructor(target: BuildTargetPlatform, release: boolean) {
        this._raw = { 'name': '' };
        this._configPath = ResolvedPath.absolute(process.cwd());
        this._basePath = ResolvedPath.absolute(process.cwd());

        this._name = '';
        this._target = target;
        this._release = release;
        this._outDirPath = this._basePath;

        this._ignores = [];
        this._srcs = [];
        this._deps = [];
    }

    static async load(filePath: ResolvedPath, opts?: Partial<Options>): Promise<BuildSettings> {
        opts = opts ?? {};
        opts['configPath'] = filePath.dirname();

        const raw = json5.parse<RawBuildFile>(await fs.promises.readFile(filePath.toString(), { encoding: 'utf8' }));
        return BuildSettings.from(raw, opts);
    }

    static async from<T = {}>(
        raw: RawBuildFile<T>,
        opts?: Partial<Options & { 'configPath': ResolvedPath }>,
    ): Promise<BuildSettings> {
        opts = opts ?? {};
        const configPath = opts['configPath'] ?? ResolvedPath.cwd();
        const release = opts['release'] ?? false;
        const target = opts['target'] ?? (os.platform() as BuildTargetPlatform);
        const fileExtProtocols = opts['fileExtProtocols'] ?? {};
        const replaceVariables = Object.assign({}, opts['replaceVariables'] ?? null, {
            'TARGET': () => settings._target,
            'PATH': (relativePath: string) => settings._basePath.join(relativePath).toString(),
        });
        const pluginNames = opts['pluginNames'] ?? [];

        const settings = new BuildSettings(opts['target'], opts['release']);
        settings._raw = raw;
        settings._configPath = configPath;
        settings._basePath = configPath;

        settings._name = raw['name'];
        settings._target = target;
        settings._release = release;
        settings._outDirPath = raw['outDir']
            ? configPath.join(_replaceVariables(raw['outDir'], replaceVariables))
            : configPath;

        settings._ignores = (raw['ignore'] ?? [])
            .filter(_isString)
            .map(ign => configPath.join(_replaceVariables(ign, replaceVariables)));
        settings._srcs = (raw['srcs'] ?? [])
            .filter(_isString)
            .map(src => Target.parse(_replaceVariables(src, replaceVariables), configPath, fileExtProtocols));
        settings._deps = (raw['deps'] ?? [])
            .filter(_isString)
            .map(src => configPath.join(_replaceVariables(src, replaceVariables)));
        settings._pluginSettings = pluginNames.reduce((prev, pluginName) => {
            prev[pluginName] = {};
            _mergePluginSettings(prev[pluginName], raw[pluginName] ?? {}, replaceVariables);
            return prev;
        }, {});

        const knownPlatforms = KNOWN_TARGETS.reduce(
            (settings, platformName) => ({ ...settings, [platformName]: target === platformName }),
            { 'release': release },
        );

        for (const [platformName, rawPlatform] of Object.entries(raw['platform'] ?? {})) {
            if (rawPlatform == null || typeof rawPlatform !== 'object') {
                throw new Error(`invalid platform definition for [${platformName}]`);
            }

            if (
                platformName === target ||
                (platformName === 'release' && release) ||
                new Function(
                    'platform',
                    // ReferenceError.message takes the form "<name> is not defined"
                    `with(platform){for(let __retry_count__=0;__retry_count__<10;++__retry_count__){try{return(${platformName});}catch(e){if(e instanceof ReferenceError){platform[e.message.slice(0,e.message.indexOf(' '))]=undefined;}else{throw e;}}}throw new Error('failed to evaluate platform definition for [${platformName}], retried too many times');}`,
                )(Object.assign({}, knownPlatforms))
            ) {
                settings._ignores.push(
                    ...(raw['ignore'] ?? [])
                        .filter(_isString)
                        .map(ign => configPath.join(_replaceVariables(ign, replaceVariables))),
                );
                settings._srcs.push(
                    ...(rawPlatform['srcs'] ?? [])
                        .filter(_isString)
                        .map(src =>
                            Target.parse(_replaceVariables(src, replaceVariables), configPath, fileExtProtocols),
                        ),
                );
                settings._deps.push(
                    ...(rawPlatform['deps'] ?? [])
                        .filter(_isString)
                        .map(src => configPath.join(_replaceVariables(src, replaceVariables))),
                );
                pluginNames.forEach(pluginName => {
                    _mergePluginSettings(
                        settings._pluginSettings[pluginName],
                        rawPlatform[pluginName] ?? {},
                        replaceVariables,
                    );
                });
            }
        }

        settings._basePath = settings.srcs.reduce((prev, src) => prev.commonSubPath(src.path.dirname()), configPath);

        return settings;
    }

    get name(): string {
        return this._name;
    }

    get basePath(): ResolvedPath {
        return this._basePath;
    }

    get outDir(): ResolvedPath {
        return this._outDirPath;
    }

    get target(): BuildTargetPlatform {
        return this._target;
    }

    get release(): boolean {
        return this._release;
    }

    get ignorePaths(): ResolvedPath[] {
        return this._ignores;
    }

    get srcs(): Target[] {
        return this._srcs;
    }

    get deps(): ResolvedPath[] {
        return this._deps;
    }

    get raw(): any {
        return this._raw;
    }

    pluginSettings<T>(plugin: BasePlugin): Partial<T> {
        const name = plugin.name();
        if (!(name in this._pluginSettings)) {
            throw new Error(`plugin [${plugin.name()}] is not defined in this build file`);
        }

        return this._pluginSettings[name] as Partial<T>;
    }
}

function _isString(s: any) {
    return typeof s === 'string';
}

function _replaceVariables(s: string, variableMap: MapLike<(arg?: string) => string>): string {
    // Format: ${<name>} for replacements that do not take any arguments
    // Format: ${<name>:<arg>} for replacements that take one argument
    const varRegex = /\$\{([^\}:]+)(?::([^\}]*))?\}/gi;
    return s.replace(varRegex, (match, key, value) => {
        if (variableMap[key]) {
            return variableMap[key](value);
        }
        return match;
    });
}

function _mergePluginSettings(
    mergedPluginSettings: MapLike<any>,
    pluginSettings: MapLike<any>,
    replaceVariables: MapLike<(arg?: string) => string>,
) {
    for (const prop in pluginSettings) {
        if (Array.isArray(pluginSettings[prop])) {
            if (!Array.isArray(mergedPluginSettings[prop])) {
                mergedPluginSettings[prop] = [];
            }

            mergedPluginSettings[prop].push(
                ...pluginSettings[prop].map(value =>
                    typeof value === 'string' ? _replaceVariables(value, replaceVariables) : value,
                ),
            );
        } else {
            mergedPluginSettings[prop] =
                typeof pluginSettings[prop] === 'string'
                    ? _replaceVariables(pluginSettings[prop], replaceVariables)
                    : pluginSettings[prop];
        }
    }
}

interface MapLike<T> {
    [key: string]: T;
}
