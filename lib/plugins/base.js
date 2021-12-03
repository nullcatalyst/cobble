"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePlugin = void 0;
class BasePlugin {
    constructor(opts) {
        this._release = opts['release'];
        this._verbose = opts['verbose'];
        this._tmp = opts['tmp'];
    }
    get verbose() {
        return this._verbose;
    }
    get release() {
        return this._release;
    }
    get tmp() {
        return this._tmp;
    }
    name() {
        throw new Error('cannot use a plugin without a name');
    }
    // Provide a set of file extensions that can be built using this plugin
    provideProtocolExtensions() {
        return [];
    }
    // Process the build file, adding event handlers to watch for appropriate file changes
    async process(watcher, settings) {
        return () => { };
    }
    // Clean up any resources used by the plugin, it is not needed anymore and will be disposed
    cleanup() { }
}
exports.BasePlugin = BasePlugin;
