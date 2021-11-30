"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildSettings = void 0;
const fs = require("fs");
const json5 = require("json5");
const resolved_path_1 = require("../util/resolved_path");
const target_1 = require("./target");
const KNOWN_TARGETS = ['win32', 'darwin', 'linux', 'wasm'];
class BuildSettings {
    constructor(target) {
        this._raw = {};
        this._basePath = resolved_path_1.ResolvedPath.absolute('/');
        this._outputPath = this._basePath.join('a.out');
        this._name = '__unnamed__';
        this._target = target;
        this._type = 'exe';
        this._release = false;
        this._srcs = [];
        this._includes = [];
        this._defines = [];
        this._flags = [];
    }
    async load(raw, filePath, fileExtProtocols = {}) {
        const isString = s => typeof s === 'string';
        const basePath = filePath.dirname();
        const name = raw['name'] ?? filePath.name;
        this._raw = raw;
        this._basePath = basePath;
        this._outputPath = raw['output']
            ? basePath.join(this._replaceVariables(raw['output']))
            : basePath.join(_createOutputName(this._target, this._type, name));
        this._name = name;
        this._defines = raw['defines'] ?? [];
        this._flags = raw['flags'] ?? [];
        this._srcs = (raw['srcs'] ?? [])
            .filter(isString)
            .map(src => target_1.Target.parse(this._replaceVariables(src), basePath, fileExtProtocols));
        this._defines = this._defines.filter(isString);
        this._includes = (raw['includes'] ?? [])
            .filter(isString)
            .map(inc => basePath.join(this._replaceVariables(inc)));
        this._flags = this._flags.filter(isString);
        const knownPlatforms = KNOWN_TARGETS.reduce((settings, platformName) => ({ ...settings, [platformName]: this._target === platformName }), {});
        for (const [platformName, rawPlatform] of Object.entries(raw['platform'] ?? {})) {
            if (rawPlatform == null || typeof rawPlatform !== 'object') {
                throw new Error(`invalid platform definition for [${platformName}]`);
            }
            if (platformName === this._target ||
                new Function('platform', 
                // ReferenceError.message takes the form "<name> is not defined"
                `with(platform){for(;;){try{return(${platformName});}catch(e){if(e instanceof ReferenceError){platform[e.message.slice(0,e.message.indexOf(' '))]=undefined;}else{throw e;}}}}`)(Object.assign({}, knownPlatforms))) {
                const platformSettings = new BuildSettings(this._target);
                await platformSettings.load(rawPlatform, filePath);
                this.merge(platformSettings);
            }
        }
        for (const dep of raw['deps'] ?? []) {
            if (typeof dep !== 'string') {
                throw new Error(`invalid dependency definition: dependency [${dep}] must be a string`);
            }
            const depPath = basePath.join(this._replaceVariables(dep));
            const depBuild = new BuildSettings(this._target);
            const raw = json5.parse(await fs.promises.readFile(depPath.toString(), { encoding: 'utf8' }));
            await depBuild.load(raw, depPath);
            this.mergeDependency(raw['name'], depBuild);
        }
    }
    get name() {
        return this._name;
    }
    get basePath() {
        return this._basePath;
    }
    get outputPath() {
        return this._outputPath;
    }
    get target() {
        return this._target;
    }
    get type() {
        return this._type;
    }
    get release() {
        return this._release;
    }
    get debug() {
        return !this._release;
    }
    get srcs() {
        return this._srcs;
    }
    get includes() {
        return this._includes;
    }
    get defines() {
        return this._defines;
    }
    get flags() {
        return this._flags;
    }
    raw(property) {
        return this._raw[property];
    }
    merge(other) {
        if (this._target !== other._target) {
            throw new Error('cannot merge builds with different targets');
        }
        this._srcs = [...new Set([...this._srcs, ...other._srcs])];
        this._includes = [...new Set([...this._includes, ...other._includes])];
        this._defines = [...new Set([...this._defines, ...other._defines])];
        this._flags = [...new Set([...this._flags, ...other._flags])];
        return this;
    }
    mergeDependency(otherName, other) {
        if (this._target !== other._target) {
            throw new Error('cannot merge builds with different targets');
        }
        // this._srcs = [...new Set([...other._srcs, ...this._srcs])];
        this._defines = [...new Set([...other._defines, ...this._defines])];
        this._includes = [...new Set([...other._includes, ...this._includes])];
        this._flags = [...new Set([...other._flags, ...this._flags])];
        return this;
    }
    _replaceVariables(s) {
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
exports.BuildSettings = BuildSettings;
function _createOutputName(target, type, name) {
    switch (target) {
        case 'win32':
            return `${name}.${type}`;
        case 'wasm':
            return `${type === 'lib' ? 'lib' : ''}${name}.wasm`;
        default:
            return `${type === 'lib' ? 'lib' : ''}${name}${type === 'lib' ? '.a' : ''}`;
    }
}
