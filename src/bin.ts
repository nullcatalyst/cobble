import { Command, Option } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as tmpPromise from 'tmp-promise';
import { BuildTargetPlatform } from '.';
import { BuildSettings } from './build/settings';
import { BasePlugin, PluginOptions } from './plugins/base';
import { createMailbox } from './util/mailbox';
import { mkdir } from './util/mkdir';
import { ResolvedPath } from './util/resolved_path';
import { Event, EventType } from './watcher/event';
import { FileWatcher } from './watcher/file';

const defer: (() => void)[] = [() => {}];
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

const program = new Command();
program.version('0.2.0');
program
    .command('watch')
    .description('build and watch the project for changes, rebuilding as necessary')
    .requiredOption('-c, --config <config>', 'temporary directory to output intermediate build files to', '')
    .option('-v, --verbose', 'enable verbose logging', (_, prev) => prev + 1, 0)
    .option('-t, --tmp <directory>', 'temporary directory to output intermediate build files to', '')
    .option('--release', 'build the release version', false)
    .addOption(
        new Option('-m, --mode <mode>', 'target to build for')
            .choices(['win32', 'darwin', 'linux', 'wasm'])
            .default(os.platform()),
    )
    .action(async function (this: Command) {
        interface WatchOptions {
            config: string;
            verbose: number;
            tmp: string;
            release: boolean;
            mode: BuildTargetPlatform;
        }

        try {
            const opts = Object.assign({}, this.opts<WatchOptions>());
            if (opts.tmp === '') {
                const { path, cleanup } = await tmpPromise.dir({ unsafeCleanup: true });
                defer.push(cleanup);
                opts.tmp = path;
            }

            const cwd = ResolvedPath.absolute(process.cwd());
            const tmp = cwd.join(opts.tmp);

            await mkdir(tmp);

            const watcher = new FileWatcher(opts.verbose);
            defer.push(() => watcher.stop());

            const plugins = await loadPlugins(
                {
                    'verbose': opts.verbose,
                    'tmp': tmp,
                },
                opts.verbose,
            );
            const srcExtProtocols = plugins.reduce(
                (srcExtProtocols, plugin) =>
                    plugin.provideProtocolExtensions().reduce((prev, ext) => {
                        prev[ext] = plugin.name();
                        return prev;
                    }, Object.assign({}, srcExtProtocols)),
                {},
            );
            if (opts.verbose >= 2) {
                for (const ext in srcExtProtocols) {
                    console.log(`[EXT] "${ext}" => "${srcExtProtocols[ext]}"`);
                }
            }

            // Calculate the longest common subpath shared by all the config files
            const configs = [opts.config];
            const commonBasePath = configs.reduce(
                (prev, arg) => prev.commonSubPath(cwd.join(arg).dirname()),
                cwd.join(configs[0]).dirname(),
            );

            // Initialize all of the plugins, passing them each of the build settings
            const settingsList = await Promise.all(
                configs.map(async arg => {
                    const configPath = cwd.join(arg);
                    const settings = await BuildSettings.load(configPath, {
                        'release': opts.release,
                        'target': opts.mode,
                        'fileExtProtocols': srcExtProtocols,
                        'pluginNames': plugins.map(plugin => plugin.name()),
                    });
                    console.log(`--- building "${arg}" ---`);

                    // Tell all of the plugins about this build file
                    await Promise.all(
                        plugins.map(async plugin => {
                            const reset = await plugin.process(watcher, settings);
                            watcher.add(
                                configPath,
                                createMailbox(async event => {
                                    if (event.type === EventType.AddFile) {
                                        return;
                                    }
                                    return reset();
                                }),
                            );
                        }),
                    );

                    return settings;
                }),
            );

            if (opts.verbose >= 1) {
                console.log(`[WATCH] ${commonBasePath}`);
            }
            watcher.start(commonBasePath);

            // Check if any explicit srcs do not exist under the common base path
            // If they aren't, then send a single event to the watcher to build, it's the only one they're going to get
            for (const settings of settingsList) {
                for (const src of settings.srcs) {
                    if (!src.path.toString().startsWith(commonBasePath.toString())) {
                        if (opts.verbose >= 2) {
                            console.log(`[WARN] ${src} does not exist under ${commonBasePath} and will not be watched`);
                        }
                        watcher.emit(new Event(EventType.AddFile, src.path));
                    }
                }
            }
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    })
    .parse();

async function loadPlugins(opts: PluginOptions, verbose: number): Promise<BasePlugin[]> {
    const plugins = await fs.promises.readdir(path.resolve(__dirname, '../..'));
    return plugins
        .filter(plugin => plugin.startsWith('cobble-plugin-'))
        .map(plugin => {
            if (verbose >= 2) {
                console.log(`[LOAD] "${plugin}"`);
            }

            const module = require(plugin);
            return new ((module.default ?? module) as typeof BasePlugin)(Object.assign({}, opts));
        });
}
