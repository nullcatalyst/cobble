"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs = require("fs");
const os = require("os");
const path = require("path");
const tmpPromise = require("tmp-promise");
const settings_1 = require("./build/settings");
const mailbox_1 = require("./util/mailbox");
const mkdir_1 = require("./util/mkdir");
const resolved_path_1 = require("./util/resolved_path");
const event_1 = require("./watcher/event");
const file_1 = require("./watcher/file");
const defer = [() => { }];
const cleanup = (...args) => {
    if (defer.length > 0) {
        console.log('--- exitting ---', args);
        defer.forEach(f => f());
        defer.length = 0;
        process.exit();
    }
};
process.on('exit', cleanup);
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGKILL', cleanup);
const program = new commander_1.Command();
program.version('0.2.0');
program
    .command('watch')
    .description('build and watch the project for changes, rebuilding as necessary')
    .argument('<config...>')
    .option('-v, --verbose', 'enable verbose logging', (_, prev) => prev + 1, 0)
    .option('--release', 'build the release version', false)
    .option('-t, --tmp <directory>', 'temporary directory to output intermediate build files to', '')
    .addOption(new commander_1.Option('-m, --mode <mode>', 'target to build for')
    .choices(['win32', 'darwin', 'linux', 'wasm'])
    .default(os.platform()))
    .action(async function (args) {
    try {
        const opts = Object.assign({}, this.opts());
        if (opts.tmp === '') {
            const { path, cleanup } = await tmpPromise.dir({ unsafeCleanup: true });
            defer.push(cleanup);
            opts.tmp = path;
        }
        const cwd = resolved_path_1.ResolvedPath.absolute(process.cwd());
        const tmp = cwd.join(opts.tmp);
        await (0, mkdir_1.mkdir)(tmp);
        const watcher = new file_1.FileWatcher(opts.verbose);
        defer.push(() => watcher.stop());
        const plugins = await loadPlugins({
            'verbose': opts.verbose,
            'tmp': tmp,
        }, opts.verbose);
        const srcExtProtocols = plugins.reduce((srcExtProtocols, plugin) => plugin.provideProtocolExtensions().reduce((prev, ext) => {
            prev[ext] = plugin.name();
            return prev;
        }, Object.assign({}, srcExtProtocols)), {});
        if (opts.verbose >= 2) {
            for (const ext in srcExtProtocols) {
                console.log(`[EXT] "${ext}" => "${srcExtProtocols[ext]}"`);
            }
        }
        // Calculate the longest common subpath shared by all the config files
        const commonBasePath = args.reduce((prev, arg) => prev.commonSubPath(cwd.join(arg).dirname()), cwd.join(args[0]).dirname());
        // Initialize all of the plugins, passing them each of the build settings
        await Promise.all(args.map(async (arg) => {
            const configPath = cwd.join(arg);
            const settings = await settings_1.BuildSettings.load(configPath, {
                'release': opts.release,
                'target': opts.mode,
                'fileExtProtocols': srcExtProtocols,
                'pluginNames': plugins.map(plugin => plugin.name()),
            });
            console.log(`--- building "${arg}" ---`);
            // Tell all of the plugins about this build file
            await Promise.all(plugins.map(async (plugin) => {
                const reset = await plugin.process(watcher, settings);
                watcher.add(configPath, (0, mailbox_1.createMailbox)(async (event) => {
                    if (event.type === event_1.EventType.AddFile) {
                        return;
                    }
                    return reset();
                }));
            }));
        }));
        if (opts.verbose >= 1) {
            console.log(`[WATCH] ${commonBasePath}`);
        }
        watcher.start(commonBasePath);
    }
    catch (err) {
        console.error(err);
    }
})
    .parse();
async function loadPlugins(opts, verbose) {
    const plugins = await fs.promises.readdir(path.resolve(__dirname, '../..'));
    return plugins
        .filter(plugin => plugin.startsWith('cobble-plugin-'))
        .map(plugin => {
        if (verbose >= 2) {
            console.log(`[LOAD] "${plugin}"`);
        }
        const module = require(plugin);
        return new (module.default ?? module)(Object.assign({}, opts));
    });
}
