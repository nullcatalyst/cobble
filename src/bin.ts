import { Command, Option } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as tmpPromise from 'tmp-promise';
import { BuildSettings } from './build/settings';
import { BasePlugin, PluginOptions } from './plugins/base';
import { createMailbox } from './util/mailbox';
import { mkdir } from './util/mkdir';
import { ResolvedPath } from './util/resolved_path';
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
program.version('0.1.0').option('-v, --verbose', 'enable verbose logging', (_, prev) => prev + 1, 0);
program
    .command('build')
    .description('build the project from scratch')
    .argument('<config...>')
    .option('--release', 'build the release version', false)
    .option('-t, --tmp <directory>', 'temporary directory to output intermediate build files to', '')
    .addOption(
        new Option('-m, --mode <mode>', 'target to build for')
            .choices(['win32', 'darwin', 'linux', 'wasm'])
            .default(os.platform()),
    )
    .action(async function (this: Command, args: string[]) {
        try {
            const opts = Object.assign({}, this.opts());
            if (opts.tmp === '') {
                const { path, cleanup } = await tmpPromise.dir({ unsafeCleanup: true });
                defer.push(cleanup);
                opts.tmp = path;
            }

            const cwd = ResolvedPath.absolute(process.cwd());
            const tmp = cwd.join(opts.tmp);

            await mkdir(tmp);

            let commonBasePath = cwd.join(args[0]).dirname();
            const watcher = new FileWatcher();
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

            await Promise.all(
                args.map(async arg => {
                    const configPath = cwd.join(arg);
                    commonBasePath = commonBasePath.commonSubPath(configPath.dirname());

                    const settings = await BuildSettings.load(configPath, {
                        'release': opts.release,
                        'target': opts.mode,
                        'fileExtProtocols': srcExtProtocols,
                        'pluginNames': plugins.map(plugin => plugin.name()),
                    });
                    console.log(`--- building "${arg}" ---`);

                    await Promise.all(
                        plugins.map(async plugin => {
                            const reset = await plugin.process(watcher, settings);
                            watcher.add(
                                configPath,
                                createMailbox(async event => {
                                    return reset();
                                }),
                            );
                        }),
                    );
                }),
            );

            watcher.start(commonBasePath);
        } catch (err) {
            console.error(err);
        }
    })
    .parse(process.argv.slice(1));

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
