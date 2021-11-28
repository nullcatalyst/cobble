import { Command } from 'commander';
import * as fs from 'fs';
import * as json5 from 'json5';
import * as os from 'os';
import * as tmpPromise from 'tmp-promise';
import { BuildTargetPlatform } from './composer/raw';
import { BuildSettings } from './composer/settings';
import { ClangPlugin } from './plugins/clang';
import { mkdir } from './util/mkdir';
import { ResolvedPath } from './util/resolved_path';
import { FileWatcher } from './watcher/file';

const defer: (() => void)[] = [() => {}];
const cleanup = (...args) => {
    if (defer.length > 0) {
        console.log('... exitting ...', args);
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
    .action(async function (this: Command, args: string[]) {
        try {
            const opts = Object.assign({}, this.opts());
            if (opts.tmp === '') {
                const { path, cleanup } = await tmpPromise.dir({ unsafeCleanup: true });
                defer.push(cleanup);
                opts.tmp = path;
            }

            const cwd = ResolvedPath.absolute(process.cwd());
            const tmp = cwd.relative(opts.tmp);

            await mkdir(tmp);

            // TODO: choose a better base directory than just the current working directory
            const clang = new ClangPlugin(tmp);
            for (const config of args) {
                const configPath = cwd.relative(config);
                const watcher = new FileWatcher(configPath.dirname());
                const settings = new BuildSettings(os.platform() as BuildTargetPlatform);
                settings.load(
                    json5.parse(await fs.promises.readFile(configPath.toString(), { encoding: 'utf8' })),
                    configPath,
                );
                console.log(`Building ${settings.name}`);
                clang.process(watcher, settings);
            }
        } catch (err) {
            console.error(err);
        }
    })
    .parse(process.argv.slice(1));
