"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePlugin = void 0;
class BasePlugin {
    constructor(opts) {
        this._release = opts['release'];
        this._verbose = opts['verbose'];
        this._tmpPath = opts['tmp'];
    }
    /**
     * @returns the verbosity level for this plugin
     */
    get verbose() {
        return this._verbose;
    }
    /**
     * @returns whether this plugin is being used in a release build
     */
    get release() {
        return this._release;
    }
    /**
     * @returns a fully resolved path to a temporary directory that can be used for intermediate files
     */
    get tmpPath() {
        return this._tmpPath;
    }
    /**
     * @returns the name of this plugin
     */
    name() {
        throw new Error('cannot use a plugin without a name');
    }
    /**
     * Provide a set of file extensions that can be built using this plugin
     * @returns the list of file extensions
     */
    provideProtocolExtensions() {
        return [];
    }
    /**
     * Process the build file, adding event handlers to watch for appropriate file changes
     * @param watcher the watcher to use
     * @param settings the build settings
     * @returns a cleanup function, which will be called whenever the build file changes; this should remove all existing event handlers in case the files are no longer needed
     */
    async process(watcher, settings) {
        return () => { };
    }
    /**
     * Clean up any resources used by the plugin, it is not needed anymore and will be disposed
     */
    cleanup() { }
    /**
     * Filter the list of sources defined in the build settings to only those that are supported by this plugin
     * @param settings the build settings
     * @returns the filtered list of sources
     */
    filterSrcs(settings) {
        return settings.srcs.filter(src => src.protocol === this.name());
    }
    /**
     * Log a message, but only if the verbose level is high enough.
     * @param minimumVerbosityLevel the verbose level to log at
     * @param message the message(s) to log
     */
    log(minimumVerbosityLevel, ...message) {
        if (this._verbose >= minimumVerbosityLevel) {
            console.log(`[${this.name()}]`, ...message);
        }
    }
}
exports.BasePlugin = BasePlugin;
