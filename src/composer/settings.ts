import * as fs from 'fs';
import * as json5 from 'json5';

import { BuildTargetPlatform, BuildType, RawBuildFile } from './raw';

import { ResolvedPath } from '../util/resolved_path';

const KNOWN_TARGETS = ['win32', 'darwin', 'linux', 'wasm'];

export class BuildSettings {
    private _raw: RawBuildFile;
    private _basePath: ResolvedPath;
    private _outputPath: ResolvedPath;

    private _name: string;
    private _target: BuildTargetPlatform;
    private _type: BuildType;
    private _release: boolean;

    private _srcs: ResolvedPath[];
    private _includes: ResolvedPath[];
    private _defines: string[];
    private _flags: string[];

    constructor(target: BuildTargetPlatform) {
        this._raw = {};
        this._basePath = ResolvedPath.absolute('/');
        this._outputPath = this._basePath.relative('a.out');

        this._name = '__unnamed__';
        this._target = target;
        this._type = 'exe';
        this._release = false;

        this._srcs = [];
        this._includes = [];
        this._defines = [];
        this._flags = [];
    }

    async load(raw: RawBuildFile, filePath: ResolvedPath): Promise<void> {
        const isString = s => typeof s === 'string';

        const basePath = filePath.dirname();
        const name = raw['name'] ?? filePath.name;

        this._raw = raw;
        this._basePath = basePath;
        this._outputPath = raw['output']
            ? basePath.relative(this._replaceVariables(raw['output']))
            : basePath.replaceFileName(_createOutputName(this._target, this._type, name));
        this._name = name;
        this._defines = raw['defines'] ?? [];
        this._flags = raw['flags'] ?? [];

        this._srcs = (raw['srcs'] ?? []).filter(isString).map(src => basePath.relative(this._replaceVariables(src)));
        this._defines = this._defines.filter(isString);
        this._includes = (raw['includes'] ?? [])
            .filter(isString)
            .map(inc => basePath.relative(this._replaceVariables(inc)));
        this._flags = this._flags.filter(isString);

        const knownPlatforms = KNOWN_TARGETS.reduce(
            (settings, platformName) => ({ ...settings, [platformName]: this._target === platformName }),
            {},
        );

        for (const [platformName, rawPlatform] of Object.entries(raw['platform'] ?? {})) {
            if (rawPlatform == null || typeof rawPlatform !== 'object') {
                throw new Error(`invalid platform definition for [${platformName}]`);
            }

            if (
                platformName === this._target ||
                new Function(
                    'platform',
                    // ReferenceError.message takes the form "<name> is not defined"
                    `with(platform){for(;;){try{return(${platformName});}catch(e){if(e instanceof ReferenceError){platform[e.message.slice(0,e.message.indexOf(' '))]=undefined;}else{throw e;}}}}`,
                )(Object.assign({}, knownPlatforms))
            ) {
                const platformSettings = new BuildSettings(this._target);
                await platformSettings.load(rawPlatform, filePath);
                this.merge(platformSettings);
            }
        }

        for (const dep of raw['deps'] ?? []) {
            if (typeof dep !== 'string') {
                throw new Error(`invalid dependency definition: dependency [${dep}] must be a string`);
            }

            const depPath = basePath.relative(this._replaceVariables(dep));
            const depBuild = new BuildSettings(this._target);
            const raw = json5.parse<RawBuildFile>(await fs.promises.readFile(depPath.toString(), { encoding: 'utf8' }));
            await depBuild.load(raw, depPath);
            this.mergeDependency(raw['name'], depBuild);
        }
    }

    get name(): string {
        return this._name;
    }

    get basePath(): ResolvedPath {
        return this._basePath;
    }

    get outputPath(): ResolvedPath {
        return this._outputPath;
    }

    get target(): BuildTargetPlatform {
        return this._target;
    }

    get type(): BuildType {
        return this._type;
    }

    get release(): boolean {
        return this._release;
    }

    get debug(): boolean {
        return !this._release;
    }

    get srcs(): ResolvedPath[] {
        return this._srcs;
    }

    get includes(): ResolvedPath[] {
        return this._includes;
    }

    get defines(): string[] {
        return this._defines;
    }

    get flags(): string[] {
        return this._flags;
    }

    raw<T>(property: string): T | undefined {
        return this._raw[property];
    }

    merge(other: BuildSettings): this {
        if (this._target !== other._target) {
            throw new Error('cannot merge builds with different targets');
        }

        this._srcs = [...new Set([...this._srcs, ...other._srcs])];
        this._includes = [...new Set([...this._includes, ...other._includes])];
        this._defines = [...new Set([...this._defines, ...other._defines])];
        this._flags = [...new Set([...this._flags, ...other._flags])];
        return this;
    }

    mergeDependency(otherName: string, other: BuildSettings): this {
        if (this._target !== other._target) {
            throw new Error('cannot merge builds with different targets');
        }

        // this._srcs = [...new Set([...other._srcs, ...this._srcs])];
        this._defines = [...new Set([...other._defines, ...this._defines])];
        this._includes = [...new Set([...other._includes, ...this._includes])];
        this._flags = [...new Set([...other._flags, ...this._flags])];
        return this;
    }

    private _replaceVariables(s: string): string {
        // Format: ${<name>} for replacements that do not take any arguments
        // Format: ${<name>:<arg>} for replacements that take one argument
        const varRegex = /\$\{([^\}:]+)(?::([^\}]*))?\}/gi;
        const variableMap = {
            'TARGET': () => this._target,
            'LIB': name => {
                switch (this._target) {
                    case 'win32':
                        return `${name}.lib`;
                    default:
                        return `lib${name}.a`;
                }
            },
            'EXE': name => {
                switch (this._target) {
                    case 'win32':
                        return `${name}.exe`;
                    default:
                        return name;
                }
            },
        };

        return s.replaceAll(varRegex, (match, key, value) => {
            if (variableMap[key]) {
                return variableMap[key](value);
            }
            return match;
        });
    }
}

function _createOutputName(target: BuildTargetPlatform, type: BuildType, name: string): string {
    switch (target) {
        case 'win32':
            return `${name}.${type}`;
        case 'wasm':
            return `${type === 'lib' ? 'lib' : ''}${name}.wasm`;
        default:
            return `${type === 'lib' ? 'lib' : ''}${name}${type === 'lib' ? '.a' : ''}`;
    }
}
