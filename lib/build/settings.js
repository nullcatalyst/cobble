"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildSettings = void 0;
const fs = require("fs");
const json5 = require("json5");
const os = require("os");
const resolved_path_1 = require("../util/resolved_path");
const target_1 = require("./target");
const KNOWN_TARGETS = ['win32', 'darwin', 'linux', 'wasm'];
class BuildSettings {
    constructor(target, release) {
        this._pluginSettings = {};
        this._raw = { 'name': '' };
        this._basePath = resolved_path_1.ResolvedPath.absolute(process.cwd());
        this._name = '';
        this._target = target;
        this._release = release;
        this._srcs = [];
        this._deps = [];
    }
    static async load(filePath, opts) {
        opts = opts ?? {};
        opts['basePath'] = filePath.dirname();
        const raw = json5.parse(await fs.promises.readFile(filePath.toString(), { encoding: 'utf8' }));
        return BuildSettings.from(raw, opts);
    }
    static async from(raw, opts) {
        opts = opts ?? {};
        const basePath = opts.basePath ?? resolved_path_1.ResolvedPath.cwd();
        const release = opts['release'] ?? false;
        const target = opts['target'] ?? os.platform();
        const fileExtProtocols = opts['fileExtProtocols'] ?? {};
        const replaceVariables = Object.assign({}, opts['replaceVariables'] ?? null, {
            'TARGET': () => settings._target,
        });
        const pluginNames = opts['pluginNames'] ?? [];
        const settings = new BuildSettings(opts['target'], opts['release']);
        settings._raw = raw;
        settings._basePath = basePath;
        settings._name = raw['name'];
        settings._outDirPath = raw['outDir']
            ? basePath.join(_replaceVariables(raw['outDir'], replaceVariables))
            : basePath;
        settings._srcs = (raw['srcs'] ?? [])
            .filter(_isString)
            .map(src => target_1.Target.parse(_replaceVariables(src, replaceVariables), basePath, fileExtProtocols));
        settings._deps = (raw['deps'] ?? [])
            .filter(_isString)
            .map(src => basePath.join(_replaceVariables(src, replaceVariables)));
        settings._pluginSettings = pluginNames.reduce((prev, pluginName) => {
            prev[pluginName] = raw[pluginName] ?? {};
            return prev;
        }, {});
        const knownPlatforms = KNOWN_TARGETS.reduce((settings, platformName) => ({ ...settings, [platformName]: target === platformName }), { 'release': release });
        for (const [platformName, rawPlatform] of Object.entries(raw['platform'] ?? {})) {
            if (rawPlatform == null || typeof rawPlatform !== 'object') {
                throw new Error(`invalid platform definition for [${platformName}]`);
            }
            if (platformName === target ||
                (platformName === 'release' && release) ||
                new Function('platform', 
                // ReferenceError.message takes the form "<name> is not defined"
                `with(platform){for(let __retry_count__=0;__retry_count__<10;++__retry_count__){try{return(${platformName});}catch(e){if(e instanceof ReferenceError){platform[e.message.slice(0,e.message.indexOf(' '))]=undefined;}else{throw e;}}}throw new Error('failed to evaluate platform definition for [${platformName}], retried too many times');}`)(Object.assign({}, knownPlatforms))) {
                settings._srcs.push(...(rawPlatform['srcs'] ?? [])
                    .filter(_isString)
                    .map(src => target_1.Target.parse(_replaceVariables(src, replaceVariables), basePath, fileExtProtocols)));
                settings._deps.push(...(rawPlatform['deps'] ?? [])
                    .filter(_isString)
                    .map(src => basePath.join(_replaceVariables(src, replaceVariables))));
                pluginNames.forEach(pluginName => {
                    const mergedPluginSettings = settings._pluginSettings[pluginName];
                    const pluginSettings = rawPlatform[pluginName] ?? {};
                    for (const prop in pluginSettings) {
                        if (Array.isArray(pluginSettings[prop]) && Array.isArray(mergedPluginSettings[prop])) {
                            mergedPluginSettings[prop].push(...pluginSettings[prop]);
                        }
                        else {
                            mergedPluginSettings[prop] = pluginSettings[prop];
                        }
                    }
                });
            }
        }
        return settings;
    }
    get name() {
        return this._name;
    }
    get basePath() {
        return this._basePath;
    }
    get outDir() {
        return this._outDirPath;
    }
    get target() {
        return this._target;
    }
    get release() {
        return this._release;
    }
    get srcs() {
        return this._srcs;
    }
    get deps() {
        return this._deps;
    }
    get raw() {
        return this._raw;
    }
    pluginSettings(plugin) {
        const name = plugin.name();
        if (!(name in this._pluginSettings)) {
            throw new Error(`plugin [${plugin.name()}] is not defined in this build file`);
        }
        return this._pluginSettings[name];
    }
}
exports.BuildSettings = BuildSettings;
function _isString(s) {
    return typeof s === 'string';
}
function _replaceVariables(s, variableMap) {
    // Format: ${<name>} for replacements that do not take any arguments
    // Format: ${<name>:<arg>} for replacements that take one argument
    const varRegex = /\$\{([^\}:]+)(?::([^\}]*))?\}/gi;
    return s.replaceAll(varRegex, (match, key, value) => {
        if (variableMap[key]) {
            return variableMap[key](value);
        }
        return match;
    });
}
