"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const json5 = require("json5");
const os = require("os");
const tmpPromise = require("tmp-promise");
const commander_1 = require("commander");
const settings_1 = require("./composer/settings");
const clang_1 = require("./plugins/clang");
const file_1 = require("./watcher/file");
const resolved_path_1 = require("./util/resolved_path");
const mkdir_1 = require("./util/mkdir");
const defer = [() => { }];
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
const program = new commander_1.Command();
program.version('0.1.0').option('-v, --verbose', 'enable verbose logging', (_, prev) => prev + 1, 0);
program
    .command('build')
    .description('build the project from scratch')
    .argument('<config...>')
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
        const tmp = cwd.relative(opts.tmp);
        await (0, mkdir_1.mkdir)(tmp);
        // TODO: choose a better base directory than just the current working directory
        const clang = new clang_1.ClangPlugin(tmp);
        for (const config of args) {
            const configPath = cwd.relative(config);
            const watcher = new file_1.FileWatcher(configPath.dirname());
            const settings = new settings_1.BuildSettings(opts.mode);
            settings.load(json5.parse(await fs.promises.readFile(configPath.toString(), { encoding: 'utf8' })), configPath);
            console.log(`Building ${settings.name}`);
            clang.process(watcher, settings);
        }
    }
    catch (err) {
        console.error(err);
    }
})
    .parse(process.argv.slice(1));
